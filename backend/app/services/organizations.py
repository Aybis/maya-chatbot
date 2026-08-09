"""Organization / membership services + RBAC helpers.

Provides tenant-scoped queries and role enforcement for the multi-tenant model.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException

from app.db.database import get_db

ROLE_ORDER = {"member": 1, "admin": 2, "owner": 3}


def role_at_least(role: str, minimum: str) -> bool:
    """True if ``role`` grants at least ``minimum`` privileges."""
    return ROLE_ORDER.get(role, 0) >= ROLE_ORDER.get(minimum, 0)


async def create_organization(db, name: str, slug: str, owner_id: str, plan: str = "free") -> dict:
    org_id = secrets.token_hex(16)
    await db.execute(
        "INSERT INTO organizations (id, name, slug, plan, created_by) VALUES (?, ?, ?, ?, ?)",
        (org_id, name, slug, plan, owner_id),
    )
    # Creator becomes owner.
    await db.execute(
        "INSERT INTO organizations_users (id, organization_id, user_id, role) VALUES (?, ?, ?, 'owner')",
        (secrets.token_hex(16), org_id, owner_id),
    )
    await db.commit()
    org = await get_organization(db, org_id)
    assert org is not None
    return org


async def get_organization(db, org_id: str) -> Optional[dict]:
    cur = await db.execute("SELECT * FROM organizations WHERE id = ?", (org_id,))
    row = await cur.fetchone()
    return dict(row) if row else None


async def get_membership(db, org_id: str, user_id: str) -> Optional[dict]:
    cur = await db.execute(
        "SELECT * FROM organizations_users WHERE organization_id = ? AND user_id = ?",
        (org_id, user_id),
    )
    row = await cur.fetchone()
    return dict(row) if row else None


async def list_user_orgs(db, user_id: str) -> list[dict]:
    cur = await db.execute(
        """SELECT o.*, ou.role AS membership_role
           FROM organizations o
           JOIN organizations_users ou ON ou.organization_id = o.id
           WHERE ou.user_id = ?
           ORDER BY o.created_at""",
        (user_id,),
    )
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def list_org_members(db, org_id: str) -> list[dict]:
    cur = await db.execute(
        """SELECT ou.id AS membership_id, ou.role, ou.joined_at,
                  u.id AS user_id, u.email, u.username, u.avatar_url
           FROM organizations_users ou
           JOIN users u ON u.id = ou.user_id
           WHERE ou.organization_id = ?
           ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.username""",
        (org_id,),
    )
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def create_invitation(db, org_id: str, email: str, role: str, invited_by: str, ttl_hours: int = 72) -> dict:
    inv_id = secrets.token_hex(16)
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=ttl_hours)
    await db.execute(
        """INSERT INTO invitations (id, organization_id, email, role, token, status, invited_by, expires_at)
           VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)""",
        (inv_id, org_id, email.lower(), role, token, invited_by, expires.isoformat()),
    )
    await db.commit()
    return {"id": inv_id, "email": email.lower(), "role": role, "token": token,
            "status": "pending", "expires_at": expires.isoformat()}


async def accept_invitation(db, token: str, user_id: str) -> dict:
    cur = await db.execute(
        "SELECT * FROM invitations WHERE token = ? AND status = 'pending'", (token,))
    inv = await cur.fetchone()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    inv = dict(inv)
    # Check expiry
    if inv.get("expires_at"):
        try:
            exp = datetime.fromisoformat(inv["expires_at"])
            if exp < datetime.utcnow():
                raise HTTPException(status_code=410, detail="Invitation expired")
        except ValueError:
            pass
    # Create membership
    await db.execute(
        """INSERT OR IGNORE INTO organizations_users (id, organization_id, user_id, role)
           VALUES (?, ?, ?, ?)""",
        (secrets.token_hex(16), inv["organization_id"], user_id, inv["role"]),
    )
    await db.execute("UPDATE invitations SET status = 'accepted' WHERE id = ?", (inv["id"],))
    await db.commit()
    return {"organization_id": inv["organization_id"], "role": inv["role"]}


async def update_membership_role(db, org_id: str, user_id: str, role: str) -> None:
    await db.execute(
        "UPDATE organizations_users SET role = ? WHERE organization_id = ? AND user_id = ?",
        (role, org_id, user_id),
    )
    await db.commit()


async def remove_membership(db, org_id: str, user_id: str) -> None:
    await db.execute(
        "DELETE FROM organizations_users WHERE organization_id = ? AND user_id = ?",
        (org_id, user_id),
    )
    await db.commit()


async def require_org_membership(db, org_id: str, user_id: str, min_role: str = "member"):
    """FastAPI-style helper: raise 403 unless the user belongs to org with role."""
    membership = await get_membership(db, org_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    if not role_at_least(membership["role"], min_role):
        raise HTTPException(status_code=403, detail=f"Requires {min_role} role or higher")
    return membership