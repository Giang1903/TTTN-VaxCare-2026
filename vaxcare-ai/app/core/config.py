from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  # vaxcare-ai-service/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    model_dir: Path = BASE_DIR / "models"
    data_dir: Path = BASE_DIR / "data"

    # AI1
    schedule_model_name: str = "schedule_waittime.joblib"
    recommend_overload_threshold: float = 0.35
    max_recommendations: int = 3


settings = Settings()
