import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ApiKey, ApiKeyCreate, ApiKeyCreated
from app.db.database import get_db
from app.services.auth import get_org_context
from app.services.api_keys import generate_api_key

router = APIRouter()


def _row_to_apikey(row) -> ApiKey:
    return ApiKey(
        id=row["id"],
        organization_id=row["organization_id"],
        name=row["name"],
        prefix=row["prefix"],
        created_by=row["created_by"],
        last_used_at=row["last_used_at"],
        expires_at=row["expires_at"],
        revoked=bool(row["revoked"]),
        created_at=row["created_at"],
    )


@router.post("/", response_model=ApiKeyCreated)
async def create_api_key(body: ApiKeyCreate, ctx: dict = Depends(get_org_context)):
    plaintext, key_hash, display_prefix = generate_api_key()
    key_id = str(uuid.uuid4())
    now = datetime.now()
    async for db in get_db():
        await db.execute(
            """INSERT INTO api_keys
               (id, organization_id, name, key_hash, prefix, created_by, expires_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                key_id, ctx["org_id"], body.name, key_hash, display_prefix,
                ctx["user_id"],
                body.expires_at.isoformat() if body.expires_at else None,
                now.isoformat(),
            ),
        )
        await db.commit()
    return ApiKeyCreated(
        id=key_id,
        name=body.name,
        key=plaintext,
        prefix=display_prefix,
        expires_at=body.expires_at,
        created_at=now,
    )


@router.get("/", response_model=list[ApiKey])
async def list_api_keys(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM api_keys WHERE organization_id = ? ORDER BY created_at DESC",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [_row_to_apikey(r) for r in rows]


@router.delete("/{key_id}")
async def revoke_api_key(key_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT id FROM api_keys WHERE id = ? AND organization_id = ?",
            (key_id, ctx["org_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="API key not found")
        await db.execute(
            "UPDATE api_keys SET revoked = 1 WHERE id = ? AND organization_id = ?",
            (key_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "revoked"}
