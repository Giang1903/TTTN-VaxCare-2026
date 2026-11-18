from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.routers import chatbot, demand, health, schedule
from app.services.model_loader import load_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    status = load_all()
    app.state.model_status = status
    yield


app = FastAPI(
    title="VaxCare AI Service",
    description=(
        "AI Service cho VaxCare:\n"
        "- AI1: Gợi ý / xếp hạng khung giờ tiêm (schedule coordination)\n"
        "- AI2: Dự báo nhu cầu vắc xin (vaccine demand forecast)\n"
        "- Chatbot: tư vấn vaccine / lịch tiêm / lịch sử (rules + RAG + LLM)"
    ),
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router)
app.include_router(demand.router)
app.include_router(chatbot.router)
app.include_router(health.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "version": "1.2.0",
        "modules": ["schedule-coordination", "vaccine-demand-forecast", "chatbot"],
        "endpoints": {
            "AI1": "POST /api/v1/ai/schedule",
            "AI2": "POST /api/v1/ai/forecast",
            "Chatbot": "POST /api/v1/chatbot/chat",
            "Health": "GET /health",
        },
    }
