import json
import uuid
from typing import AsyncGenerator, Optional

import httpx

from app.core.config import settings
from app.services.token_tracker import track_usage


class LLMService:
    """Multi-provider LLM routing backed by the per-org provider registry.

    Each org configures providers (base_url + api_key) in the DB. A model
    reference looks like ``provider_name/model_id`` (e.g. ``shiteru/deepseek-v4-flash``),
    or falls back to the org's default provider.
    """

    def __init__(self):
        self._http: Optional[httpx.AsyncClient] = None

    @property
    def http(self) -> httpx.AsyncClient:
        if self._http is None:
            self._http = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=20.0))
        return self._http

    async def resolve_provider(self, db, org_id: str, model_ref: str) -> tuple[dict, str]:
        """Resolve ``provider_name/model_id`` → (provider row, model_id).

        If the model ref has no ``/`` prefix, use the org's default provider.
        """
        from app.services.providers import list_providers

        providers = await list_providers(db, org_id)
        if not providers:
            raise ValueError("No providers configured for this organization")

        if "/" in model_ref:
            provider_name, _, model_id = model_ref.partition("/")
            for p in providers:
                if p["name"].lower() == provider_name.lower():
                    return p, model_id
            raise ValueError(f"Provider '{provider_name}' not found in this organization")

        default = next((p for p in providers if p["is_default"]), None)
        provider = default or providers[0]
        return provider, model_ref

    async def stream_chat(
        self,
        messages: list[dict],
        model: str = "",
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        conversation_id: str = "",
        org_id: str = "",
        user_id: str = "",
        provider: Optional[dict] = None,
        model_id: Optional[str] = None,
    ):
        """Stream a chat completion via the org's provider registry."""
        from app.db.database import get_db

        if provider is None or model_id is None:
            async for db in get_db():
                try:
                    provider, model_id = await self.resolve_provider(db, org_id, model)
                except ValueError as e:
                    yield json.dumps({"error": str(e)})
                    return
                break

        async for chunk in self._stream_openai_compatible(
            provider, model_id, messages, system_prompt,
            temperature, max_tokens, conversation_id, org_id, user_id,
        ):
            yield chunk

    async def _stream_openai_compatible(
        self, provider, model_id, messages, system_prompt,
        temperature, max_tokens, conversation_id, org_id, user_id,
    ):
        """Generic OpenAI-compatible streaming (works for shiteru, surplus, openrouter, any /v1 provider)."""
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        url = provider["base_url"].rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {provider['api_key']}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_id,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        total_prompt_tokens = 0
        total_completion_tokens = 0
        emitted_any = False

        try:
            async with self.http.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code >= 400:
                    body = (await response.aread()).decode("utf-8", errors="replace")[:500]
                    yield json.dumps({
                        "error": f"{provider['name']} returned HTTP {response.status_code}: {body}"
                    })
                    return

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    choices = chunk.get("choices") or []
                    if choices and choices[0].get("delta", {}).get("content"):
                        emitted_any = True
                        yield json.dumps({
                            "type": "token",
                            "content": choices[0]["delta"]["content"],
                        })
                    # Non-stream usage (some providers only send it at the end)
                    usage = chunk.get("usage")
                    if usage:
                        total_prompt_tokens = usage.get("prompt_tokens") or total_prompt_tokens
                        total_completion_tokens = usage.get("completion_tokens") or total_completion_tokens
        except httpx.HTTPError as e:
            yield json.dumps({"error": f"{provider['name']} connection error: {e}"})
            return
        finally:
            pass

        # Track usage if we got it (most OpenAI-compatible streams don't send it mid-stream)
        if settings.track_tokens and (total_prompt_tokens or total_completion_tokens):
            await track_usage(
                conversation_id=conversation_id,
                provider=provider["name"],
                model=model_id,
                prompt_tokens=total_prompt_tokens,
                completion_tokens=total_completion_tokens,
                user_id=user_id,
                organization_id=org_id,
            )

        if not emitted_any:
            yield json.dumps({"error": "Provider returned no content"})
        else:
            yield json.dumps({"type": "done"})


llm_service = LLMService()