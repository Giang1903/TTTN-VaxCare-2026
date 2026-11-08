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

    # AI1 – Schedule coordination (legacy, có thể gỡ sau)
    schedule_model_name: str = "schedule_waittime.joblib"
    recommend_overload_threshold: float = 0.35
    max_recommendations: int = 3

    # AI2 – Vaccine demand forecast (legacy)
    demand_model_name: str = "demand_forecast.joblib"
    demand_min_history_points: int = 7
    forecast_default_horizon_days: int = 28
    forecast_default_period_days: int = 7

    # Chatbot
    chatbot_enabled: bool = True
    internal_api_key: str = ""
    knowledge_dir: Path = BASE_DIR / "knowledge"
    faiss_index_path: Path = BASE_DIR / "knowledge" / "index" / "faiss.index"
    chunks_meta_path: Path = BASE_DIR / "knowledge" / "index" / "chunks_meta.json"
    intent_model_name: str = "intent_clf.joblib"

    # LLM – mặc định Ollama
    llm_backend: str = "ollama"  # ollama | llama_cpp | transformers | mock
    llm_model_name: str = "qwen2.5:1.5b"
    llm_timeout_sec: float = 45.0  # giảm từ 60 để tránh treo lâu
    ollama_base_url: str = "http://127.0.0.1:11434"
    llm_gguf_path: str = ""  # path tới .gguf nếu dùng llama_cpp

    # RAG 
    embedding_model_name: str = "BAAI/bge-m3"
    retrieval_top_k: int = 5
    retrieval_min_score: float = 0.50  # tăng từ 0.48
    retrieval_score_margin: float = 0.10  # tăng từ 0.08
    intent_min_confidence: float = 0.45
    chat_timeout_sec: float = 40.0


settings = Settings()
