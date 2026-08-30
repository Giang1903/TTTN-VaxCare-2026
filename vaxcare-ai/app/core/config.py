from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    model_dir: Path = BASE_DIR / "models"
    data_dir: Path = BASE_DIR / "data"

    # AI1 – Schedule coordination
    schedule_model_name: str = "schedule_waittime.joblib"
    recommend_overload_threshold: float = 0.35
    max_recommendations: int = 3

    # AI2 – Vaccine demand forecast
    demand_model_name: str = "demand_forecast.joblib"
    demand_min_history_points: int = 7  # tối thiểu để dùng model (không fallback)
    forecast_default_horizon_days: int = 28
    forecast_default_period_days: int = 7


settings = Settings()