from fastapi import APIRouter
from app.api.routes import projects, chat, memory, skills, files, analytics, auth, providers, prompts

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(providers.router, prefix="/providers", tags=["providers"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(memory.router, prefix="/memory", tags=["memory"])
router.include_router(skills.router, prefix="/skills", tags=["skills"])
router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
router.include_router(files.router, prefix="/files", tags=["files"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])