"""Lightweight MCP client (Phase B4).

Scope note from the plan: rather than the full MCP SDK, this is an HTTP
tool-call integration — list tools from a server and invoke them. The client
tries the MCP conventional endpoints (``/tools``, ``/tools/list``) and a
generic invoke (``/tools/{name}/invoke``, ``/call``). It's intentionally
defensive: unknown servers simply return empty tool lists.
"""
from typing import Optional

import httpx

_TIMEOUT = httpx.Timeout(20.0, connect=10.0)


async def list_tools(url: str) -> list[dict]:
    """Fetch the tool list from an MCP/tool server.

    Returns a normalized list of ``{name, description, parameters}``.
    """
    base = url.rstrip("/")
    candidates = [f"{base}/tools", f"{base}/tools/list", f"{base}/list_tools"]
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        for endpoint in candidates:
            try:
                resp = await client.get(endpoint)
                if resp.status_code >= 400:
                    continue
                data = resp.json()
                tools = data.get("tools") if isinstance(data, dict) else data
                if isinstance(tools, list):
                    return [_normalize_tool(t) for t in tools]
            except Exception:
                continue
    return []


def _normalize_tool(raw: dict) -> dict:
    return {
        "name": raw.get("name") or raw.get("id") or "unknown",
        "description": raw.get("description") or "",
        "parameters": raw.get("parameters") or raw.get("input_schema") or {},
    }


async def invoke_tool(url: str, tool_name: str, arguments: dict) -> dict:
    """Invoke a tool on the server. Returns the raw result dict."""
    base = url.rstrip("/")
    payloads = [
        (f"{base}/tools/{tool_name}/invoke", {"arguments": arguments}),
        (f"{base}/call", {"name": tool_name, "arguments": arguments}),
        (f"{base}/tools/call", {"name": tool_name, "arguments": arguments}),
    ]
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        last_err: Optional[str] = None
        for endpoint, payload in payloads:
            try:
                resp = await client.post(endpoint, json=payload)
                if resp.status_code >= 400:
                    last_err = f"HTTP {resp.status_code} from {endpoint}"
                    continue
                return resp.json()
            except Exception as e:
                last_err = str(e)
                continue
    return {"error": last_err or "No invoke endpoint responded"}
