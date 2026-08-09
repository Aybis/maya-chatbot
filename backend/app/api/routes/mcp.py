import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.schemas import McpServer, McpServerCreate
from app.db.database import get_db
from app.services.auth import get_org_context
from app.services import mcp as mcp_service

router = APIRouter()


def _row_to_server(row) -> McpServer:
    return McpServer(
        id=row["id"],
        organization_id=row["organization_id"],
        name=row["name"],
        url=row["url"],
        enabled=bool(row["enabled"]),
        created_at=row["created_at"],
    )


@router.post("/", response_model=McpServer)
async def create_server(body: McpServerCreate, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        sid = str(uuid.uuid4())
        now = datetime.now()
        await db.execute(
            """INSERT INTO mcp_servers (id, organization_id, name, url, enabled, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (sid, ctx["org_id"], body.name, body.url, body.enabled, now.isoformat()),
        )
        await db.commit()
        return McpServer(
            id=sid, organization_id=ctx["org_id"], name=body.name,
            url=body.url, enabled=body.enabled, created_at=now,
        )


@router.get("/", response_model=list[McpServer])
async def list_servers(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM mcp_servers WHERE organization_id = ? ORDER BY created_at DESC",
            (ctx["org_id"],),
        )
        rows = await cursor.fetchall()
        return [_row_to_server(r) for r in rows]


@router.delete("/{server_id}")
async def delete_server(server_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        await db.execute(
            "DELETE FROM mcp_servers WHERE id = ? AND organization_id = ?",
            (server_id, ctx["org_id"]),
        )
        await db.commit()
        return {"status": "deleted"}


@router.post("/{server_id}/toggle", response_model=McpServer)
async def toggle_server(server_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM mcp_servers WHERE id = ? AND organization_id = ?",
            (server_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Server not found")
        new_val = 0 if row["enabled"] else 1
        await db.execute("UPDATE mcp_servers SET enabled = ? WHERE id = ?", (new_val, server_id))
        await db.commit()
        cursor = await db.execute("SELECT * FROM mcp_servers WHERE id = ?", (server_id,))
        return _row_to_server(await cursor.fetchone())


@router.get("/{server_id}/tools")
async def list_server_tools(server_id: str, ctx: dict = Depends(get_org_context)):
    """List tools exposed by an MCP server."""
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM mcp_servers WHERE id = ? AND organization_id = ?",
            (server_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Server not found")
        tools = await mcp_service.list_tools(row["url"])
        return {"server": row["name"], "tools": tools}


class InvokeRequest(BaseModel):
    arguments: dict = {}


@router.post("/{server_id}/tools/{tool_name}/invoke")
async def invoke_server_tool(
    server_id: str, tool_name: str, body: InvokeRequest,
    ctx: dict = Depends(get_org_context),
):
    """Invoke a tool on an MCP server."""
    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM mcp_servers WHERE id = ? AND organization_id = ? AND enabled = 1",
            (server_id, ctx["org_id"]),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Enabled server not found")
        result = await mcp_service.invoke_tool(row["url"], tool_name, body.arguments)
        return {"server": row["name"], "tool": tool_name, "result": result}
