import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import Project, ProjectCreate
from app.db.database import get_db
from app.services.auth import get_org_context

router = APIRouter()


@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        project_id = str(uuid.uuid4())
        await db.execute(
            """INSERT INTO projects (id, organization_id, user_id, name, description, system_prompt)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (project_id, ctx["org_id"], ctx["user_id"], project.name, project.description, project.system_prompt),
        )
        await db.commit()
        return Project(
            id=project_id,
            name=project.name,
            description=project.description,
            system_prompt=project.system_prompt,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )


@router.get("/", response_model=list[Project])
async def list_projects(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM projects WHERE organization_id = ? ORDER BY updated_at DESC",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [
            Project(
                id=r["id"], name=r["name"], description=r["description"],
                system_prompt=r["system_prompt"],
                created_at=r["created_at"], updated_at=r["updated_at"],
            )
            for r in rows
        ]


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM projects WHERE id = ? AND organization_id = ?",
            (project_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        return Project(
            id=row["id"], name=row["name"], description=row["description"],
            system_prompt=row["system_prompt"],
            created_at=row["created_at"], updated_at=row["updated_at"],
        )


@router.delete("/{project_id}")
async def delete_project(project_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        await db.execute(
            "DELETE FROM projects WHERE id = ? AND organization_id = ?",
            (project_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "deleted"}