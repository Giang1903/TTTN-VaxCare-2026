from pathlib import Path

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_detail():
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "modules": {
            "ai1_schedule": (settings.model_dir / settings.schedule_model_name).exists(),
            "ai2_demand": (settings.model_dir / settings.demand_model_name).exists(),
            "chatbot": settings.chatbot_enabled,
            "intent_model": (settings.model_dir / settings.intent_model_name).exists(),
            "faiss_index": Path(settings.faiss_index_path).exists(),
            "llm_backend": settings.llm_backend,
        },
        "endpoints": {
            "AI1": "POST /api/v1/ai/schedule",
            "AI2": "POST /api/v1/ai/forecast",
            "Chatbot": "POST /api/v1/chatbot/chat",
            "Health": "GET /health",
        },
    }
