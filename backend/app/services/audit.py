"""Audit log helper (Phase B3).

Fire-and-forget recording of security-relevant actions per organization.
Failures are swallowed — audit logging must never break the request path.
"""
import json
import uuid
from typing import Optional


async def log_audit(
    db,
    organization_id: str,
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> None:
    """Insert an audit_logs row. Never raises."""
    try:
        await db.execute(
            """INSERT INTO audit_logs
               (id, organization_id, user_id, action, resource_type, resource_id, ip, user_agent, metadata)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                str(uuid.uuid4()),
                organization_id,
                user_id,
                action,
                resource_type,
                resource_id,
                ip,
                user_agent,
                json.dumps(metadata or {}),
            ),
        )
        await db.commit()
    except Exception:
        pass
