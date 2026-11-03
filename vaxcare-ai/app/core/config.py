from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    model_dir: Path = BASE_DIR / "models"
    data_dir: Path = BASE_DIR / "data"
    log_level: str = "INFO"

    # AI1 – Schedule coordination
    schedule_model_name: str = "schedule_waittime.joblib"
    recommend_overload_threshold: float = 0.35
    max_recommendations: int = 3

    # AI2 – Vaccine demand forecast
    demand_model_name: str = "demand_forecast.joblib"
    demand_min_history_points: int = 7  # tối thiểu để dùng model (không fallback)
    forecast_default_horizon_days: int = 28
    forecast_default_period_days: int = 7

    # Chatbot (phase 0)
    chatbot_enabled: bool = True
    internal_api_key: str = ""
    knowledge_dir: Path = BASE_DIR / "knowledge"
    faiss_index_path: Path = BASE_DIR / "knowledge" / "index" / "faiss.index"
    chunks_meta_path: Path = BASE_DIR / "knowledge" / "index" / "chunks_meta.json"
    intent_model_name: str = "intent_clf.joblib"
    llm_backend: str = "mock"
    llm_model_name: str = "qwen2.5:1.5b"
    embedding_model_name: str = "BAAI/bge-m3"
    retrieval_top_k: int = 5
    retrieval_min_score: float = 0.35
    intent_min_confidence: float = 0.45
    chat_timeout_sec: float = 30.0

settings = Settings()