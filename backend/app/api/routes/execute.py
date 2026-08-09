"""Public code execution endpoint (Phase B5).

Authenticated via org API key (same as /v1/chat/completions) so customers can
run code through the API. Also reachable with a JWT for in-app use.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.db.database import get_db
from app.services.api_keys import resolve_api_key, touch_api_key
from app.services.auth import decode_token
from app.services.sandbox import execute_code

router = APIRouter()
security = HTTPBearer(auto_error=False)


class ExecuteRequest(BaseModel):
    language: str
    code: str
    timeout: Optional[int] = 10


async def _auth_context(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Accept either an org API key (maya_...) or a JWT access token."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    cred = credentials.credentials

    # API key path
    if cred.startswith("maya_"):
        async for db in get_db():
            key_row = await resolve_api_key(db, cred)
            if not key_row:
                raise HTTPException(status_code=401, detail="Invalid or revoked API key")
            await touch_api_key(db, key_row["id"])
            return {"org_id": key_row["organization_id"], "user_id": key_row["created_by"]}

    # JWT path
    payload = decode_token(cred, "access")
    if payload:
        return {"org_id": payload.get("org"), "user_id": payload["sub"]}

    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/execute")
async def execute(body: ExecuteRequest, ctx: dict = Depends(_auth_context)):
    if not body.code or not body.code.strip():
        raise HTTPException(status_code=400, detail="code is required")
    result = await execute_code(body.language, body.code, body.timeout or 10)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
