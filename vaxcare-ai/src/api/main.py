from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import dispatch, forecast
from src.common.config import settings

app = FastAPI(
    title="VaxCare AI Service",
    description="AI 1 (điều phối lịch tiêm) & AI 2 (dự báo nhu cầu vắc xin) cho hệ thống VaxCare",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dispatch.router)
app.include_router(forecast.router)


@app.get("/", tags=["Health"], summary="Health check")
def health_check() -> dict:
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "vaxcare_be_url": settings.vaxcare_be_url,
    }
