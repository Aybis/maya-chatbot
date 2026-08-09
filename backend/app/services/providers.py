"""Provider registry service — Hermes-style dynamic provider configuration.

Providers are stored in the DB (per-org) with a base_url + api_key. Models are
auto-discovered from each provider's OpenAI-compatible ``/models`` endpoint,
and each model carries capability metadata (reasoning, vision, audio, file,
multimodal, context window, etc.).
"""
from __future__ import annotations

import json
import secrets
from typing import Optional

import httpx
from fastapi import HTTPException

# Rough capability heuristics keyed by model-name substrings. These are
# overridden by metadata returned from the provider when available.
CAPABILITY_HINTS = [
    # Vision / multimodal
    (("vision", "vl", "multimodal", "omni", "vlm"), {"vision": True, "multimodal": True}),
    # Audio / speech
    (("audio", "tts", "speech", "voice", "whisper", "realtime"), {"audio": True}),
    # File / code / reasoning
    (("reason", "thinking", "coder", "code", "instruct"), {"reasoning": True}),
]

# Model-id patterns that imply a capability even without a hint.
# These are matched as substrings against the lowercased model id. Keep them
# current — providers rarely return capability metadata, so this list is the
# primary signal for well-known multimodal families.
VISION_IDS = (
    # explicit vision markers
    "vision", "vl", "-v-", "_v_", "omni", "minicpm-v", "qwen-vl", "llava",
    # OpenAI multimodal families (gpt-4o, gpt-4.1, gpt-5.x are vision+ audio-capable)
    "gpt-4o", "gpt-4.1", "gpt-5", "o1", "o3", "o4",
    # Anthropic — all Claude 3+ models are vision-capable
    "claude-3", "claude-4", "claude-5", "claude-opus", "claude-sonnet", "claude-haiku",
    # Google Gemini (1.5+ / 2.x are natively multimodal)
    "gemini-1.5", "gemini-2", "gemini-pro",
    # Qwen Max / flagship multimodal
    "qwen-3", "qwen-max", "qwen2.5", "qwen3",
    # Kimi (Moonshot) multimodal
    "kimi",
    # GLM-4V+ / GLM-5 multimodal
    "glm-4v", "glm-5",
)
AUDIO_IDS = ("audio", "voice", "whisper", "tts", "speech", "realtime", "gpt-4o", "gpt-5")
FILE_IDS = ("file", "doc", "pdf", "tool", "agent", "coding", "code")


def infer_capabilities(model_id: str, raw: Optional[dict] = None) -> dict:
    """Build a capability dict for a model.

    Precedence: explicit provider metadata > id heuristics > sensible defaults.
    Raw metadata may come from provider-specific fields (e.g. OpenRouter
    ``supported_parameters``, or a ``capabilities`` object).
    """
    caps: dict = {
        "reasoning": False,
        "vision": False,
        "multimodal": False,
        "audio": False,
        "file_input": False,
        "tool_use": True,          # most chat models support tools
        "context_window": None,
        "max_output": None,
        "modalities": ["text"],
    }

    model_lower = model_id.lower()

    # 1. Explicit provider metadata (highest priority)
    if raw:
        sup = raw.get("supported_parameters") or {}
        if isinstance(sup, dict):
            if "input_audio" in sup or "audio" in sup:
                caps["audio"] = True
            if "input_image" in sup or "image" in sup or "vision" in sup:
                caps["vision"] = True; caps["multimodal"] = True
            if "input_file" in sup or "file" in sup:
                caps["file_input"] = True
            if "reasoning" in sup or "reasoning_effort" in sup:
                caps["reasoning"] = True
        if "context_length" in raw:
            caps["context_window"] = raw.get("context_length")
        if "max_output_tokens" in raw:
            caps["max_output"] = raw.get("max_output_tokens")
        if isinstance(raw.get("capabilities"), dict):
            caps.update({k: v for k, v in raw["capabilities"].items() if v is not None})

    # 2. Id heuristics
    if not caps["vision"] and any(s in model_lower for s in VISION_IDS):
        caps["vision"] = True; caps["multimodal"] = True
    if not caps["audio"] and any(s in model_lower for s in AUDIO_IDS):
        caps["audio"] = True
    if not caps["file_input"] and any(s in model_lower for s in FILE_IDS):
        caps["file_input"] = True
    if not caps["reasoning"] and any(s in ("reason", "thinking", "coder", "code") for s in model_lower.split("-")) and "instruct" not in model_lower:
        caps["reasoning"] = True

    # 3. Modalities summary
    modes = ["text"]
    if caps["vision"]:
        modes.append("image")
    if caps["audio"]:
        modes.append("audio")
    if caps["file_input"]:
        modes.append("file")
    caps["modalities"] = modes

    return caps


async def discover_models(base_url: str, api_key: str, timeout: float = 30.0) -> list[dict]:
    """Fetch the model list from a provider's OpenAI-compatible ``/models`` endpoint.

    Returns a list of ``{id, name, capabilities}`` dicts. Raises HTTPException
    on connection/auth errors so the UI can surface a clear message.
    """
    url = base_url.rstrip("/") + "/models"
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, headers=headers)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach provider: {e}")

    if resp.status_code == 401 or resp.status_code == 403:
        # Use 400 (not 401) so this doesn't collide with the JWT auth flow
        # (the frontend treats 401 as "access token expired" and tries to refresh).
        raise HTTPException(status_code=400, detail="Invalid API key for this provider")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Provider returned HTTP {resp.status_code}")

    try:
        data = resp.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Provider returned invalid JSON")

    raw_models = data.get("data") or data.get("models") or []
    out = []
    for m in raw_models:
        if isinstance(m, str):
            mid = m
            raw = None
        else:
            mid = m.get("id") or m.get("name") or ""
            raw = m
        if not mid:
            continue
        out.append({
            "id": mid,
            "name": (raw or {}).get("name") or mid,
            "capabilities": infer_capabilities(mid, raw),
        })
    return out


async def create_provider(db, org_id: str, name: str, base_url: str, api_key: str) -> dict:
    pid = secrets.token_hex(16)
    await db.execute(
        """INSERT INTO providers (id, organization_id, name, base_url, api_key)
           VALUES (?, ?, ?, ?, ?)""",
        (pid, org_id, name.strip(), base_url.strip().rstrip("/"), api_key.strip()),
    )
    await db.commit()
    prov = await get_provider(db, pid)
    assert prov is not None
    return prov


async def get_provider(db, provider_id: str, org_id: Optional[str] = None) -> Optional[dict]:
    query = "SELECT * FROM providers WHERE id = ?"
    params: list = [provider_id]
    if org_id:
        query += " AND organization_id = ?"
        params.append(org_id)
    cur = await db.execute(query, params)
    row = await cur.fetchone()
    return dict(row) if row else None


async def list_providers(db, org_id: str) -> list[dict]:
    cur = await db.execute(
        "SELECT * FROM providers WHERE organization_id = ? ORDER BY is_default DESC, created_at",
        (org_id,),
    )
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def list_provider_models(db, provider_id: str, org_id: str) -> list[dict]:
    cur = await db.execute(
        """SELECT * FROM provider_models
           WHERE provider_id = ? AND organization_id = ?
           ORDER BY model_id""",
        (provider_id, org_id),
    )
    rows = await cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["capabilities"] = json.loads(d["capabilities"] or "{}")
        except ValueError:
            d["capabilities"] = {}
        out.append(d)
    return out


async def store_models(db, provider_id: str, org_id: str, models: list[dict]) -> None:
    """Replace the discovered model set for a provider."""
    await db.execute(
        "DELETE FROM provider_models WHERE provider_id = ? AND organization_id = ?",
        (provider_id, org_id),
    )
    for m in models:
        await db.execute(
            """INSERT OR REPLACE INTO provider_models
               (id, provider_id, organization_id, model_id, name, capabilities)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (secrets.token_hex(16), provider_id, org_id, m["id"], m.get("name", m["id"]),
             json.dumps(m.get("capabilities", {}))),
        )
    await db.commit()


async def delete_provider(db, provider_id: str, org_id: str) -> None:
    await db.execute(
        "DELETE FROM providers WHERE id = ? AND organization_id = ?", (provider_id, org_id)
    )
    await db.commit()


async def set_default_provider(db, org_id: str, provider_id: str) -> None:
    await db.execute(
        "UPDATE providers SET is_default = 0 WHERE organization_id = ?", (org_id,)
    )
    await db.execute(
        "UPDATE providers SET is_default = 1 WHERE id = ? AND organization_id = ?",
        (provider_id, org_id),
    )
    await db.commit()