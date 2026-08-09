import json
import uuid
from datetime import datetime, date
from app.db.database import get_db

# Per-million-token pricing (update as needed)
PRICING = {
    "openai": {
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
        "o1-preview": {"input": 15.00, "output": 60.00},
    },
    "anthropic": {
        "claude-sonnet-4-20250514": {"input": 3.00, "output": 15.00},
        "claude-opus-4-20250514": {"input": 15.00, "output": 75.00},
        "claude-haiku-4-20250514": {"input": 0.80, "output": 4.00},
    },
    "openrouter": {
        "default": {"input": 2.50, "output": 10.00},
    },
    "9router": {
        "default": {"input": 0.00, "output": 0.00},
    },
    "surplus": {
        "default": {"input": 0.50, "output": 2.00},
    },
}

async def track_usage(
    conversation_id: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    user_id: str = None,
    organization_id: str = None,
):
    """Track token usage and calculate cost."""

    provider_pricing = PRICING.get(provider, {})
    model_pricing = provider_pricing.get(model, provider_pricing.get("default", {"input": 0, "output": 0}))

    input_cost = (prompt_tokens / 1_000_000) * model_pricing["input"]
    output_cost = (completion_tokens / 1_000_000) * model_pricing["output"]
    total_cost = input_cost + output_cost

    async for db in get_db():
        await db.execute(
            """INSERT INTO token_usage 
               (id, organization_id, user_id, conversation_id, provider, model, prompt_tokens, completion_tokens, input_cost, output_cost, total_cost, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                str(uuid.uuid4()),
                organization_id,
                user_id,
                conversation_id,
                provider,
                model,
                prompt_tokens,
                completion_tokens,
                input_cost,
                output_cost,
                total_cost,
                datetime.now().isoformat(),
            )
        )
        await db.commit()


async def get_usage_summary(org_id: str, start_date: date = None, end_date: date = None) -> dict:
    """Get aggregated usage summary for an organization."""
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = date.today()

    async for db in get_db():
        cursor = await db.execute(
            """SELECT 
                COUNT(*) as total_requests,
                SUM(prompt_tokens) as total_prompt_tokens,
                SUM(completion_tokens) as total_completion_tokens,
                SUM(total_cost) as total_cost,
                provider
              FROM token_usage 
              WHERE organization_id = ? AND DATE(created_at) BETWEEN ? AND ?
              GROUP BY provider""",
            (org_id, start_date.isoformat(), end_date.isoformat())
        )
        rows = await cursor.fetchall()

        summary = {
            "total_requests": 0,
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "total_cost": 0.0,
            "by_provider": {},
        }

        for row in rows:
            summary["total_requests"] += row["total_requests"]
            summary["total_prompt_tokens"] += row["total_prompt_tokens"] or 0
            summary["total_completion_tokens"] += row["total_completion_tokens"] or 0
            summary["total_cost"] += row["total_cost"] or 0
            summary["by_provider"][row["provider"]] = {
                "requests": row["total_requests"],
                "prompt_tokens": row["total_prompt_tokens"] or 0,
                "completion_tokens": row["total_completion_tokens"] or 0,
                "cost": row["total_cost"] or 0,
            }

        return summary


async def get_daily_usage(org_id: str, days: int = 30) -> list[dict]:
    """Get daily usage trend for an organization."""
    async for db in get_db():
        cursor = await db.execute(
            """SELECT 
                DATE(created_at) as date,
                SUM(total_cost) as cost,
                SUM(prompt_tokens + completion_tokens) as tokens
              FROM token_usage 
              WHERE organization_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
              GROUP BY DATE(created_at)
              ORDER BY date""",
            (org_id, str(days),)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
