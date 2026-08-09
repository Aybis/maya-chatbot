from datetime import date
from fastapi import APIRouter, Query, Depends
from app.services.token_tracker import get_usage_summary, get_daily_usage
from app.services.auth import get_org_context

router = APIRouter()


@router.get("/usage/summary")
async def usage_summary(
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
    ctx: dict = Depends(get_org_context),
):
    """Get token usage summary for an organization."""
    start = date.fromisoformat(start_date) if start_date else date.today()
    end = date.fromisoformat(end_date) if end_date else date.today()
    return await get_usage_summary(ctx["org_id"], start, end)


@router.get("/usage/daily")
async def daily_usage(
    days: int = Query(default=30, le=365),
    ctx: dict = Depends(get_org_context),
):
    """Get daily usage trend."""
    return await get_daily_usage(ctx["org_id"], days)


@router.get("/usage/today")
async def today_usage(ctx: dict = Depends(get_org_context)):
    """Get today's usage."""
    return await get_usage_summary(ctx["org_id"], date.today(), date.today())