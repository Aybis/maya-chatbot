from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Maya Chat"
    database_url: str = "sqlite+aiosqlite:///./maya_chat.db"

    # OpenAI
    openai_api_key: str = ""

    # Anthropic
    anthropic_api_key: str = ""

    # OpenRouter (unified API, 400+ models)
    openrouter_api_key: str = ""

    # 9Router (local proxy for multi-provider routing + token tracking)
    nine_router_url: str = "http://localhost:20128"
    nine_router_enabled: bool = False

    # Surplus Intelligence (spot-market inference)
    surplus_intelligence_api_key: str = ""
    surplus_intelligence_url: str = "https://api.surplusintelligence.ai"
    surplus_intelligence_enabled: bool = False

    # Default provider & model
    default_provider: str = "openai"  # openai | anthropic | openrouter | 9router | surplus
    default_model: str = "gpt-4o"

    # Token tracking
    track_tokens: bool = True
    cost_alert_threshold: float = 5.0

    # Auth
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    web_search_enabled: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
