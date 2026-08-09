import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.db.database import get_db
from app.services.auth import get_org_context

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: str = None,
    ctx: dict = Depends(get_org_context),
):
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    filepath = os.path.join(UPLOAD_DIR, f"{ctx['org_id']}_{file_id}{file_ext}")

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    async for db in get_db():
        await db.execute(
            """INSERT INTO files (id, organization_id, user_id, filename, filepath, mime_type, size, conversation_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (file_id, ctx["org_id"], ctx["user_id"], file.filename, filepath,
             file.content_type, len(content), conversation_id),
        )
        # Verify conversation belongs to org if provided
        if conversation_id:
            cur = await db.execute(
                "SELECT id FROM conversations WHERE id = ? AND organization_id = ?",
                (conversation_id, ctx["org_id"]),
            )
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="Conversation not found")
        await db.commit()

    return {
        "id": file_id,
        "filename": file.filename,
        "size": len(content),
        "mime_type": file.content_type,
    }