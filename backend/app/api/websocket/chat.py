import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.llm import llm_service
from app.services.memory import get_memories_context
from app.db.database import get_db
from app.models.schemas import ChatRequest
from app.services.auth import decode_token

ws_router = APIRouter()


@ws_router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    # Authenticate via ?token= (access JWT) query param.
    token = websocket.query_params.get("token")
    payload = decode_token(token, "access") if token else None
    user_id = payload["sub"] if payload else None

    if not user_id:
        await websocket.send_text(json.dumps({"type": "error", "content": "Unauthorized"}))
        await websocket.close(code=4401)
        return

    # Resolve org with the same fallback chain as REST get_org_context:
    # token claim -> X-Org-Id header -> org_id query param -> DB default org.
    # (The REST conversation-create path uses get_org_context, so the WS must
    # resolve the SAME org or the ownership check below spuriously fails.)
    org_id = payload.get("org")
    if not org_id:
        org_id = websocket.headers.get("x-org-id")
    if not org_id:
        org_id = websocket.query_params.get("org_id")

    from app.services.organizations import ensure_user_org, get_membership
    resolved_org_id: str = ""
    async for db in get_db():
        membership = None
        if org_id:
            membership = await get_membership(db, org_id, user_id)
        if not membership:
            org_id = await ensure_user_org(db, user_id)
            membership = await get_membership(db, org_id, user_id)
        if not membership or not org_id:
            await websocket.send_text(json.dumps({"type": "error", "content": "No organization"}))
            await websocket.close(code=4403)
            return
        resolved_org_id = org_id
        break

    async for db in get_db():
        try:
            while True:
                data = await websocket.receive_text()
                request = ChatRequest(**json.loads(data))

                # Verify the conversation belongs to the user's org.
                cursor = await db.execute(
                    "SELECT user_id, organization_id, project_id FROM conversations WHERE id = ?",
                    (request.conversation_id,),
                )
                row = await cursor.fetchone()
                if not row or row["organization_id"] != resolved_org_id:
                    await websocket.send_text(json.dumps({"type": "error", "content": "Conversation not found"}))
                    continue

                # Conversation history
                cursor = await db.execute(
                    "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at",
                    (request.conversation_id,),
                )
                rows = await cursor.fetchall()
                messages = [{"role": row["role"], "content": row["content"]} for row in rows]

                # New user message
                messages.append({"role": "user", "content": request.message})

                # Save user message
                msg_id = str(uuid.uuid4())
                await db.execute(
                    "INSERT INTO messages (id, conversation_id, role, content, attachments) VALUES (?, ?, ?, ?, ?)",
                    (msg_id, request.conversation_id, "user", request.message,
                     json.dumps(request.attachments)),
                )

                # Project system prompt
                cursor = await db.execute(
                    "SELECT p.system_prompt FROM projects p JOIN conversations c ON p.id = c.project_id WHERE c.id = ?",
                    (request.conversation_id,),
                )
                project = await cursor.fetchone()
                system_prompt = project["system_prompt"] if project else ""

                # Memory context
                memory_context = await get_memories_context(resolved_org_id, user_id)
                if memory_context:
                    system_prompt = f"{system_prompt}\n\n{memory_context}" if system_prompt else memory_context

                # Stream response through the org's provider registry
                full_response = ""
                async for chunk in llm_service.stream_chat(
                    messages=messages,
                    model=request.model or "",
                    system_prompt=system_prompt,
                    conversation_id=request.conversation_id,
                    org_id=resolved_org_id,
                    user_id=user_id,
                ):
                    parsed = json.loads(chunk)
                    await websocket.send_text(chunk)
                    if parsed.get("type") == "token":
                        full_response += parsed["content"]

                # Save assistant response
                assistant_id = str(uuid.uuid4())
                await db.execute(
                    "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
                    (assistant_id, request.conversation_id, "assistant", full_response),
                )
                await db.commit()

        except WebSocketDisconnect:
            break
        except Exception as e:
            await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))