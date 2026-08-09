import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from app.models.schemas import Memory, MemoryBase
from app.db.database import get_db
from app.services.auth import get_org_context

router = APIRouter()


@router.post("/", response_model=Memory)
async def create_memory(memory: MemoryBase, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        mem_id = str(uuid.uuid4())
        await db.execute(
            """INSERT INTO memories (id, organization_id, user_id, content, category)
               VALUES (?, ?, ?, ?, ?)""",
            (mem_id, ctx["org_id"], ctx["user_id"], memory.content, memory.category),
        )
        await db.commit()
        return Memory(
            id=mem_id,
            content=memory.content,
            category=memory.category,
            created_at=datetime.now(),
        )


@router.get("/", response_model=list[Memory])
async def list_memories(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM memories WHERE organization_id = ? ORDER BY created_at DESC",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [Memory(**dict(row)) for row in rows]


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        await db.execute(
            "DELETE FROM memories WHERE id = ? AND organization_id = ?",
            (memory_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "deleted"}