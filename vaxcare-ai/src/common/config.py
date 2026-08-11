from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    vaxcare_be_url: str = "http://localhost:8080"
    vaxcare_be_api_key: str = ""

    model_dir: str = "./models"
    forecast_horizon_days: int = 14

    log_level: str = "INFO"


settings = Settings()