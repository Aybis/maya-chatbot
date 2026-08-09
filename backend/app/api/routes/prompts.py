import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate
from app.db.database import get_db
from app.services.auth import get_org_context

router = APIRouter()


def _row_to_prompt(row) -> PromptTemplate:
    return PromptTemplate(
        id=row["id"],
        organization_id=row["organization_id"],
        name=row["name"],
        description=row["description"] or "",
        category=row["category"] or "general",
        content=row["content"],
        variables=json.loads(row["variables"]) if row["variables"] else [],
        is_public=bool(row["is_public"]),
        created_by=row["created_by"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("/", response_model=PromptTemplate)
async def create_prompt(prompt: PromptTemplateCreate, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        prompt_id = str(uuid.uuid4())
        now = datetime.now()
        await db.execute(
            """INSERT INTO prompt_templates
               (id, organization_id, name, description, category, content, variables, is_public, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                prompt_id, ctx["org_id"], prompt.name, prompt.description,
                prompt.category, prompt.content, json.dumps(prompt.variables),
                prompt.is_public, ctx["user_id"], now.isoformat(), now.isoformat(),
            ),
        )
        await db.commit()
        return PromptTemplate(
            id=prompt_id,
            organization_id=ctx["org_id"],
            name=prompt.name,
            description=prompt.description,
            category=prompt.category,
            content=prompt.content,
            variables=prompt.variables,
            is_public=prompt.is_public,
            created_by=ctx["user_id"],
            created_at=now,
            updated_at=now,
        )


@router.get("/", response_model=list[PromptTemplate])
async def list_prompts(
    category: Optional[str] = Query(None),
    ctx: dict = Depends(get_org_context),
):
    async for db in get_db():
        if category:
            cursor = await db.execute(
                "SELECT * FROM prompt_templates WHERE organization_id = ? AND category = ? ORDER BY updated_at DESC",
                (ctx["org_id"], category),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM prompt_templates WHERE organization_id = ? ORDER BY updated_at DESC",
                (ctx["org_id"],),
            )
        rows = await cursor.fetchall()
        return [_row_to_prompt(r) for r in rows]


@router.get("/categories", response_model=list[str])
async def list_categories(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT DISTINCT category FROM prompt_templates WHERE organization_id = ? ORDER BY category",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [r["category"] for r in rows]


@router.get("/{prompt_id}", response_model=PromptTemplate)
async def get_prompt(prompt_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM prompt_templates WHERE id = ? AND organization_id = ?",
            (prompt_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Prompt template not found")
        return _row_to_prompt(row)


@router.put("/{prompt_id}", response_model=PromptTemplate)
async def update_prompt(
    prompt_id: str,
    prompt: PromptTemplateUpdate,
    ctx: dict = Depends(get_org_context),
):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM prompt_templates WHERE id = ? AND organization_id = ?",
            (prompt_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Prompt template not found")

        updates = []
        values = []
        if prompt.name is not None:
            updates.append("name = ?")
            values.append(prompt.name)
        if prompt.description is not None:
            updates.append("description = ?")
            values.append(prompt.description)
        if prompt.category is not None:
            updates.append("category = ?")
            values.append(prompt.category)
        if prompt.content is not None:
            updates.append("content = ?")
            values.append(prompt.content)
        if prompt.variables is not None:
            updates.append("variables = ?")
            values.append(json.dumps(prompt.variables))
        if prompt.is_public is not None:
            updates.append("is_public = ?")
            values.append(prompt.is_public)

        if updates:
            updates.append("updated_at = ?")
            values.append(datetime.now().isoformat())
            values.extend([prompt_id, ctx["org_id"]])
            await db.execute(
                f"UPDATE prompt_templates SET {', '.join(updates)} WHERE id = ? AND organization_id = ?",
                values,
            )
            await db.commit()

        cursor = await db.execute(
            "SELECT * FROM prompt_templates WHERE id = ? AND organization_id = ?",
            (prompt_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        return _row_to_prompt(row)


@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        await db.execute(
            "DELETE FROM prompt_templates WHERE id = ? AND organization_id = ?",
            (prompt_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "deleted"}
