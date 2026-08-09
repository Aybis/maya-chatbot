from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.routes import v1 as v1_public
from app.api.routes import execute as execute_public
from app.api.websocket.chat import ws_router
from app.core.config import settings
from app.db.database import init_db

app = FastAPI(title="Maya Chat API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


# Internal app API (JWT auth) at /api/v1/*
app.include_router(router, prefix="/api/v1")
# Public OpenAI-compatible API (org API key auth) at /v1/*
app.include_router(v1_public.router, prefix="/v1", tags=["public-api"])
app.include_router(execute_public.router, prefix="/v1", tags=["public-api"])
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
