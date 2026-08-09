import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.db.database import get_db

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using PBKDF2."""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{hash_obj.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    salt, hash_hex = password_hash.split(":")
    hash_obj = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return hmac.compare_digest(hash_obj.hex(), hash_hex)


def _encode(payload: dict, expires_delta: timedelta) -> str:
    data = dict(payload)
    data["exp"] = datetime.utcnow() + expires_delta
    data["iat"] = datetime.utcnow()
    return jwt.encode(data, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, org_id: Optional[str] = None) -> str:
    return _encode(
        {"sub": user_id, "type": "access", "org": org_id},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: str, org_id: Optional[str] = None) -> str:
    return _encode(
        {"sub": user_id, "type": "refresh", "org": org_id},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: str = "access") -> Optional[dict]:
    """Decode + validate a JWT. Returns payload or None (instead of raising)."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """Dependency: return the user_id from a valid access token."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


async def get_org_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Dependency: resolve the active organization for a request.

    Determined by (in order) the ``X-Org-Id`` header, the token's ``org``
    claim, or the ``org_id`` query param. Returns:
    ``{"user_id", "org_id", "membership_role"}``. Raises 403 if the user is
    not a member of the resolved org, or 400 if no org can be resolved.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload["sub"]

    from app.services.organizations import get_membership, list_user_orgs

    # Resolve org: header > query param > token claim > user's first/default org.
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        org_id = request.query_params.get("org_id")
    if not org_id:
        org_id = payload.get("org")

    membership = None
    async for db in get_db():
        if org_id:
            membership = await get_membership(db, org_id, user_id)
        if not membership:
            # Fall back to the user's first org (or default) so requests with a
            # context-less (e.g. legacy) token still resolve cleanly instead of 400.
            orgs = await list_user_orgs(db, user_id)
            if orgs:
                candidate = next((o for o in orgs if o["is_default"]), orgs[0])
                org_id = candidate["id"]
                membership = await get_membership(db, org_id, user_id)
        break

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of any organization")

    return {"user_id": user_id, "org_id": org_id, "membership_role": membership["role"]}


async def get_current_user_soft(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> Optional[str]:
    """Optional auth: return user_id or None (no error)."""
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials, "access")
    return payload["sub"] if payload else None