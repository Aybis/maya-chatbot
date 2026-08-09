from fastapi import APIRouter, Depends, HTTPException
from app.db.database import get_db
from app.services.auth import get_org_context
from app.services.organizations import role_at_least

router = APIRouter()


@router.get("/summary")
async def admin_summary(ctx: dict = Depends(get_org_context)):
    """Org-level overview for the admin console. Admin/owner only."""
    if not role_at_least(ctx["membership_role"], "admin"):
        raise HTTPException(status_code=403, detail="Requires admin role or higher")

    org_id = ctx["org_id"]
    async for db in get_db():
        async def count(query, *args):
            cur = await db.execute(query, args)
            row = await cur.fetchone()
            return row[0] if row else 0

        members = await count(
            "SELECT COUNT(*) FROM organizations_users WHERE organization_id = ?", org_id)
        pending_invites = await count(
            "SELECT COUNT(*) FROM invitations WHERE organization_id = ? AND status = 'pending'", org_id)
        api_keys = await count(
            "SELECT COUNT(*) FROM api_keys WHERE organization_id = ? AND revoked = 0", org_id)
        providers = await count(
            "SELECT COUNT(*) FROM providers WHERE organization_id = ? AND enabled = 1", org_id)
        conversations = await count(
            "SELECT COUNT(*) FROM conversations WHERE organization_id = ?", org_id)
        prompts = await count(
            "SELECT COUNT(*) FROM prompt_templates WHERE organization_id = ?", org_id)
        audit_events = await count(
            "SELECT COUNT(*) FROM audit_logs WHERE organization_id = ?", org_id)

        cur = await db.execute(
            "SELECT plan, name, slug FROM organizations WHERE id = ?", (org_id,))
        org = await cur.fetchone()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        # Total spend + tokens (all time)
        cur = await db.execute(
            """SELECT COALESCE(SUM(total_cost),0), COALESCE(SUM(prompt_tokens),0), COALESCE(SUM(completion_tokens),0)
               FROM token_usage WHERE organization_id = ?""", (org_id,))
        spend = await cur.fetchone()
        total_cost, prompt_tokens, completion_tokens = (spend[0], spend[1], spend[2]) if spend else (0, 0, 0)

        return {
            "organization": {"id": org_id, "name": org["name"], "slug": org["slug"], "plan": org["plan"]},
            "counts": {
                "members": members,
                "pending_invites": pending_invites,
                "api_keys": api_keys,
                "providers": providers,
                "conversations": conversations,
                "prompts": prompts,
                "audit_events": audit_events,
            },
            "usage": {
                "total_cost": total_cost,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
            },
        }
