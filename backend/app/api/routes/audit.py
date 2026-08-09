import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.schemas import AuditLog
from app.db.database import get_db
from app.services.auth import get_org_context
from app.services.organizations import role_at_least

router = APIRouter()


def _row_to_audit(row) -> AuditLog:
    return AuditLog(
        id=row["id"],
        organization_id=row["organization_id"],
        user_id=row["user_id"],
        action=row["action"],
        resource_type=row["resource_type"],
        resource_id=row["resource_id"],
        ip=row["ip"],
        user_agent=row["user_agent"],
        metadata=json.loads(row["metadata"]) if row["metadata"] else {},
        created_at=row["created_at"],
    )


@router.get("/", response_model=list[AuditLog])
async def list_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ctx: dict = Depends(get_org_context),
):
    """List audit logs for the org. Admin/owner only."""
    if not role_at_least(ctx["membership_role"], "admin"):
        raise HTTPException(status_code=403, detail="Requires admin role or higher")

    async for db in get_db():
        if action:
            cursor = await db.execute(
                """SELECT * FROM audit_logs
                   WHERE organization_id = ? AND action = ?
                   ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                (ctx["org_id"], action, limit, offset),
            )
        else:
            cursor = await db.execute(
                """SELECT * FROM audit_logs
                   WHERE organization_id = ?
                   ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                (ctx["org_id"], limit, offset),
            )
        rows = await cursor.fetchall()
        return [_row_to_audit(r) for r in rows]


@router.get("/actions", response_model=list[str])
async def list_audit_actions(ctx: dict = Depends(get_org_context)):
    """Distinct action types present, for filter dropdowns."""
    if not role_at_least(ctx["membership_role"], "admin"):
        raise HTTPException(status_code=403, detail="Requires admin role or higher")
    async for db in get_db():
        cursor = await db.execute(
            "SELECT DISTINCT action FROM audit_logs WHERE organization_id = ? ORDER BY action",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [r["action"] for r in rows]
