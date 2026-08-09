import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import Conversation, ConversationCreate, Message
from app.db.database import get_db
from app.services.auth import get_org_context

router = APIRouter()


@router.post("/conversations/", response_model=Conversation)
async def create_conversation(conv: ConversationCreate, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        conv_id = str(uuid.uuid4())
        await db.execute(
            """INSERT INTO conversations (id, organization_id, user_id, project_id, title, model)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (conv_id, ctx["org_id"], ctx["user_id"], conv.project_id, conv.title, conv.model),
        )
        await db.commit()
        return Conversation(
            id=conv_id,
            project_id=conv.project_id,
            title=conv.title,
            model=conv.model,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )


@router.get("/conversations/", response_model=list[Conversation])
async def list_conversations(project_id: str = None, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        if project_id:
            cursor = await db.execute(
                """SELECT * FROM conversations
                   WHERE organization_id = ? AND project_id = ?
                   ORDER BY updated_at DESC""",
                (ctx["org_id"], project_id),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM conversations WHERE organization_id = ? ORDER BY updated_at DESC",
                (ctx["org_id"],),
            )
        rows = await cursor.fetchall()
        return [
            Conversation(
                id=r["id"], project_id=r["project_id"], title=r["title"],
                model=r["model"], created_at=r["created_at"], updated_at=r["updated_at"],
            )
            for r in rows
        ]


@router.get("/conversations/{conv_id}/messages", response_model=list[Message])
async def get_messages(conv_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            """SELECT id FROM conversations
               WHERE id = ? AND organization_id = ?""",
            (conv_id, ctx["org_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")

        cursor = await db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at",
            (conv_id,),
        )
        rows = await cursor.fetchall()
        return [
            Message(
                id=row["id"],
                conversation_id=row["conversation_id"],
                role=row["role"],
                content=row["content"],
                artifacts=json.loads(row["artifacts"]) if row["artifacts"] else [],
                attachments=json.loads(row["attachments"]) if row["attachments"] else [],
                created_at=row["created_at"],
            )
            for row in rows
        ]


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        await db.execute(
            "DELETE FROM conversations WHERE id = ? AND organization_id = ?",
            (conv_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "deleted"}