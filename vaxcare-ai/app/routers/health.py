from pathlib import Path

from fastapi import APIRouter, Request

from app.core.config import settings
from app.services.model_loader import get_status, is_loaded

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_detail(request: Request):
    model_status = get_status() if is_loaded() else getattr(request.app.state, "model_status", {})
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "version": "1.2.0",
        "models_loaded": is_loaded(),
        "modules": {
            "ai1_schedule": (settings.model_dir / settings.schedule_model_name).exists(),
            "ai2_demand": (settings.model_dir / settings.demand_model_name).exists(),
            "chatbot": settings.chatbot_enabled,
            "intent_model": (settings.model_dir / settings.intent_model_name).exists(),
            "faiss_index": Path(settings.faiss_index_path).exists(),
            "retriever": bool(model_status.get("retriever")),
            "llm_backend": settings.llm_backend,
        },
        "model_status": model_status,
        "endpoints": {
            "AI1": "POST /api/v1/ai/schedule",
            "AI2": "POST /api/v1/ai/forecast",
            "Chatbot": "POST /api/v1/chatbot/chat",
            "Health": "GET /health",
        },
    }
