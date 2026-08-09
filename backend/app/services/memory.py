import json
import uuid
from app.db.database import get_db


async def get_memories_context(org_id: str = None, user_id: str = None) -> str:
    """Format org memories for inclusion in system prompt."""
    async for db in get_db():
        if org_id:
            cursor = await db.execute(
                "SELECT content, category FROM memories WHERE organization_id = ? ORDER BY created_at DESC LIMIT 20",
                (org_id,),
            )
        elif user_id:
            cursor = await db.execute(
                "SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
                (user_id,),
            )
        else:
            cursor = await db.execute(
                "SELECT content, category FROM memories ORDER BY created_at DESC LIMIT 20"
            )
        rows = await cursor.fetchall()

        if not rows:
            return ""

        memory_lines = ["## Organization Memories\n"]
        for row in rows:
            memory_lines.append(f"- [{row['category']}] {row['content']}")

        return "\n".join(memory_lines)


async def search_memories(query: str, org_id: str = None, user_id: str = None) -> list[dict]:
    """Search memories by content."""
    async for db in get_db():
        if org_id:
            cursor = await db.execute(
                "SELECT * FROM memories WHERE organization_id = ? AND content LIKE ? ORDER BY created_at DESC LIMIT 10",
                (org_id, f"%{query}%"),
            )
        elif user_id:
            cursor = await db.execute(
                "SELECT * FROM memories WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC LIMIT 10",
                (user_id, f"%{query}%"),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM memories WHERE content LIKE ? ORDER BY created_at DESC LIMIT 10",
                (f"%{query}%",),
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]