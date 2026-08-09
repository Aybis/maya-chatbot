from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from app.services.auth import get_org_context
from app.services.providers import (
    create_provider,
    delete_provider,
    discover_models,
    get_provider,
    list_provider_models,
    list_providers,
    set_default_provider,
    store_models,
)

router = APIRouter()


def _provider_body(p: dict) -> dict:
    return {
        "id": p["id"],
        "name": p["name"],
        "base_url": p["base_url"],
        "enabled": bool(p["enabled"]),
        "is_default": bool(p["is_default"]),
        "created_at": p["created_at"],
    }


@router.post("/")
async def add_provider(request: dict, ctx: dict = Depends(get_org_context)):
    """Add a provider (base_url + api_key) and auto-discover its models."""
    name = (request.get("name") or "").strip()
    base_url = (request.get("base_url") or "").strip()
    api_key = (request.get("api_key") or "").strip()
    connect = bool(request.get("connect", True))

    if not name or not base_url or not api_key:
        raise HTTPException(status_code=400, detail="name, base_url, and api_key required")

    async for db in get_db():
        provider = await create_provider(db, ctx["org_id"], name, base_url, api_key)
        # Discover models
        if connect:
            try:
                models = await discover_models(base_url, api_key)
                await store_models(db, provider["id"], ctx["org_id"], models)
            except HTTPException:
                # Still create the provider; models can be fetched later.
                await db.execute(
                    "DELETE FROM providers WHERE id = ?", (provider["id"],)
                )
                await db.commit()
                raise
        else:
            await store_models(db, provider["id"], ctx["org_id"], [])
        return {**_provider_body(provider), "models_discovered": connect}


@router.get("/")
async def get_providers(ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        providers = await list_providers(db, ctx["org_id"])
        result = []
        for p in providers:
            body = _provider_body(p)
            body["models"] = await list_provider_models(db, p["id"], ctx["org_id"])
            result.append(body)
        return result


@router.post("/{provider_id}/models/refresh")
async def refresh_models(provider_id: str, ctx: dict = Depends(get_org_context)):
    """Re-discover models from a provider's /models endpoint."""
    async for db in get_db():
        provider = await get_provider(db, provider_id, ctx["org_id"])
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        models = await discover_models(provider["base_url"], provider["api_key"])
        await store_models(db, provider_id, ctx["org_id"], models)
        return {"count": len(models)}


@router.delete("/{provider_id}")
async def remove_provider(provider_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        provider = await get_provider(db, provider_id, ctx["org_id"])
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        await delete_provider(db, provider_id, ctx["org_id"])
        return {"status": "deleted"}


@router.post("/{provider_id}/default")
async def make_default(provider_id: str, ctx: dict = Depends(get_org_context)):
    async for db in get_db():
        provider = await get_provider(db, provider_id, ctx["org_id"])
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        await set_default_provider(db, ctx["org_id"], provider_id)
        return {"ok": True}


@router.get("/models")
async def all_models(ctx: dict = Depends(get_org_context)):
    """Flat list of every model across all enabled providers, with capabilities."""
    async for db in get_db():
        providers = await list_providers(db, ctx["org_id"])
        out = []
        for p in providers:
            if not p["enabled"]:
                continue
            for m in await list_provider_models(db, p["id"], ctx["org_id"]):
                out.append({
                    "id": m["model_id"],
                    "name": m["name"],
                    "provider": p["name"],
                    "provider_id": p["id"],
                    "capabilities": m["capabilities"],
                })
        return out