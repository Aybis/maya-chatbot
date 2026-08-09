import secrets
import uuid
import re

from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.organizations import (
    accept_invitation,
    create_invitation,
    create_organization,
    ensure_user_org,
    get_organization,
    get_membership,
    list_org_members,
    list_user_orgs,
    remove_membership,
    role_at_least,
    update_membership_role,
)

router = APIRouter()


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org" + secrets.token_hex(3)


def _org_body(org: dict) -> dict:
    return {
        "id": org["id"],
        "name": org["name"],
        "slug": org["slug"],
        "plan": org["plan"],
    }


@router.post("/register")
async def register(request: dict):
    """Register a new user and auto-create their personal organization."""
    email = request.get("email", "").strip().lower()
    username = request.get("username", "").strip()
    password = request.get("password", "")
    org_name = request.get("org_name", "").strip() or f"{username}'s Workspace"

    if not email or not username or not password:
        raise HTTPException(status_code=400, detail="Email, username, and password required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    async for db in get_db():
        cursor = await db.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?", (email, username)
        )
        if await cursor.fetchone():
            raise HTTPException(status_code=409, detail="Email or username already taken")

        user_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, email, username, hash_password(password)),
        )
        org = await create_organization(db, org_name, _slugify(org_name), user_id)
        await db.commit()

        access = create_access_token(user_id, org["id"])
        refresh = create_refresh_token(user_id, org["id"])
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {"id": user_id, "email": email, "username": username},
            "organizations": [_org_body(org)],
        }


@router.post("/login")
async def login(request: dict):
    email = request.get("email", "").strip().lower()
    password = request.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    async for db in get_db():
        cursor = await db.execute(
            "SELECT id, email, username, password_hash FROM users WHERE email = ?", (email,)
        )
        row = await cursor.fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Ensure legacy users (pre-multi-tenant) have an org.
        await ensure_user_org(db, row["id"], row["username"])
        orgs = await list_user_orgs(db, row["id"])
        active_org = orgs[0]["id"] if orgs else None
        return {
            "access_token": create_access_token(row["id"], active_org),
            "refresh_token": create_refresh_token(row["id"], active_org),
            "token_type": "bearer",
            "user": {"id": row["id"], "email": row["email"], "username": row["username"]},
            "organizations": [_org_body(o) for o in orgs],
        }


@router.post("/refresh")
async def refresh(request: dict):
    """Exchange a refresh token for a new access + refresh pair."""
    token = (request.get("refresh_token") or "").strip()
    payload = decode_token(token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user_id = payload["sub"]
    org_id = payload.get("org")
    access = create_access_token(user_id, org_id)
    refresh = create_refresh_token(user_id, org_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT id, email, username, avatar_url, created_at FROM users WHERE id = ?",
            (user_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        await ensure_user_org(db, user_id, row["username"])
        orgs = await list_user_orgs(db, user_id)
        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
            "avatar_url": row["avatar_url"],
            "created_at": row["created_at"],
            "organizations": [_org_body(o) for o in orgs],
        }


# ------------------- Organizations -------------------

@router.post("/organizations")
async def new_organization(request: dict, user_id: str = Depends(get_current_user)):
    name = request.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Organization name required")
    async for db in get_db():
        org = await create_organization(db, name, _slugify(name), user_id)
        await db.commit()
        return _org_body(org)


@router.get("/organizations")
async def my_organizations(user_id: str = Depends(get_current_user)):
    async for db in get_db():
        orgs = await list_user_orgs(db, user_id)
        return [_org_body(o) for o in orgs]


@router.get("/organizations/{org_id}/members")
async def org_members(org_id: str, user_id: str = Depends(get_current_user)):
    async for db in get_db():
        membership = await get_membership(db, org_id, user_id)
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this organization")
        members = await list_org_members(db, org_id)
        return [
            {**m, "membership_role": m["role"]}
            for m in members
        ]


@router.post("/organizations/{org_id}/invitations")
async def invite(request: dict, org_id: str, user_id: str = Depends(get_current_user)):
    async for db in get_db():
        membership = await get_membership(db, org_id, user_id)
        if not membership or not role_at_least(membership["role"], "admin"):
            raise HTTPException(status_code=403, detail="Requires admin role or higher")
        email = request.get("email", "").strip().lower()
        role = request.get("role", "member")
        if not email or role not in {"member", "admin"}:
            raise HTTPException(status_code=400, detail="Valid email and role required")
        inv = await create_invitation(db, org_id, email, role, user_id)
        await db.commit()
        return inv


@router.post("/invitations/accept")
async def accept_invite(request: dict, user_id: str = Depends(get_current_user)):
    token = (request.get("token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Invitation token required")
    async for db in get_db():
        result = await accept_invitation(db, token, user_id)
        await db.commit()
        return result


@router.put("/organizations/{org_id}/members/{target_user_id}")
async def set_member_role(
    org_id: str, target_user_id: str, request: dict,
    user_id: str = Depends(get_current_user),
):
    role = request.get("role", "")
    if role not in {"member", "admin", "owner"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    async for db in get_db():
        actor = await get_membership(db, org_id, user_id)
        if not actor or not role_at_least(actor["role"], "admin"):
            raise HTTPException(status_code=403, detail="Requires admin role or higher")
        if actor["role"] == "admin" and role == "owner":
            raise HTTPException(status_code=403, detail="Only an owner can grant owner role")
        await update_membership_role(db, org_id, target_user_id, role)
        await db.commit()
        return {"ok": True}


@router.delete("/organizations/{org_id}/members/{target_user_id}")
async def remove_member(
    org_id: str, target_user_id: str, user_id: str = Depends(get_current_user)
):
    async for db in get_db():
        actor = await get_membership(db, org_id, user_id)
        if not actor or not role_at_least(actor["role"], "admin"):
            raise HTTPException(status_code=403, detail="Requires admin role or higher")
        if target_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot remove yourself")
        await remove_membership(db, org_id, target_user_id)
        await db.commit()
        return {"ok": True}


@router.get("/organizations/{org_id}")
async def org_detail(org_id: str, user_id: str = Depends(get_current_user)):
    async for db in get_db():
        membership = await get_membership(db, org_id, user_id)
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this organization")
        org = await get_organization(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return {**_org_body(org), "membership_role": membership["role"]}