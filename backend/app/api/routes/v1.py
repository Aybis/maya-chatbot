"""OpenAI-compatible public API authenticated by org API keys (Phase B2).

Endpoints here accept ``Authorization: Bearer maya_...`` (an org-issued API
key), resolve the organization from the key, and route through that org's
provider registry. This is the B2B surface customers call programmatically.
"""
import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.db.database import get_db
from app.services.api_keys import resolve_api_key, touch_api_key
from app.services.llm import llm_service

router = APIRouter()
security = HTTPBearer(auto_error=False)


class ChatCompletionMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[ChatCompletionMessage]
    stream: bool = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096


async def get_api_key_context(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Dependency: authenticate via an org API key, return its context."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing API key")
    plaintext = credentials.credentials
    async for db in get_db():
        key_row = await resolve_api_key(db, plaintext)
        if not key_row:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key")
        await touch_api_key(db, key_row["id"])
        return {
            "api_key_id": key_row["id"],
            "org_id": key_row["organization_id"],
            "user_id": key_row["created_by"],
        }
    raise HTTPException(status_code=401, detail="Invalid or revoked API key")


@router.post("/chat/completions")
async def chat_completions(body: ChatCompletionRequest, ctx: dict = Depends(get_api_key_context)):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
    created = int(time.time())

    if body.stream:
        return StreamingResponse(
            _stream_sse(body, messages, completion_id, created, ctx),
            media_type="text/event-stream",
        )

    # Non-streaming: accumulate the full response.
    content_parts: list[str] = []
    async for raw in llm_service.stream_chat(
        messages=messages,
        model=body.model,
        temperature=body.temperature or 0.7,
        max_tokens=body.max_tokens or 4096,
        conversation_id="",
        org_id=ctx["org_id"],
        user_id=ctx["user_id"] or "",
    ):
        try:
            chunk = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if chunk.get("type") == "token":
            content_parts.append(chunk["content"])
        elif chunk.get("error"):
            raise HTTPException(status_code=502, detail=chunk["error"])

    content = "".join(content_parts)
    return {
        "id": completion_id,
        "object": "chat.completion",
        "created": created,
        "model": body.model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
    }


async def _stream_sse(body, messages, completion_id, created, ctx):
    """Translate the internal token stream into OpenAI-style SSE chunks."""
    async for raw in llm_service.stream_chat(
        messages=messages,
        model=body.model,
        temperature=body.temperature or 0.7,
        max_tokens=body.max_tokens or 4096,
        conversation_id="",
        org_id=ctx["org_id"],
        user_id=ctx["user_id"] or "",
    ):
        try:
            chunk = json.loads(raw)
        except json.JSONDecodeError:
            continue

        if chunk.get("type") == "token":
            payload = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": body.model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": chunk["content"]},
                        "finish_reason": None,
                    }
                ],
            }
            yield f"data: {json.dumps(payload)}\n\n"
        elif chunk.get("error"):
            err = {"error": {"message": chunk["error"], "type": "upstream_error"}}
            yield f"data: {json.dumps(err)}\n\n"
            yield "data: [DONE]\n\n"
            return
        elif chunk.get("type") == "done":
            final = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": body.model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
            }
            yield f"data: {json.dumps(final)}\n\n"
            yield "data: [DONE]\n\n"
            return

    yield "data: [DONE]\n\n"
