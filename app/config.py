from pydantic_settings import BaseSettings, SettingsConfigDict

PLACEHOLDER_OPENAI_KEYS = {
    "",
    "replace_me",
    "changeme",
    "example",
    "your_openai_api_key",
    "your-api-key-here",
}

class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5.5"
    api_username: str = ""
    api_password: str = ""
    app_env: str = "dev"
    max_agent_steps: int = 8
    max_claim_amount_automation: float = 10_000
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
normalized_key = settings.openai_api_key.strip()
if normalized_key.lower() in PLACEHOLDER_OPENAI_KEYS:
    settings.openai_api_key = ""
