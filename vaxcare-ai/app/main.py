from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import schedule, demand

app = FastAPI(
    title="VaxCare AI Service",
    description=(
        "AI Service cho VaxCare:\n"
        "- AI1: Gợi ý / xếp hạng khung giờ tiêm (schedule coordination)\n"
        "- AI2: Dự báo nhu cầu vắc xin (vaccine demand forecast)"
    ),
    version="1.1.0",
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


@app.get("/", tags=["Health"])
def health():
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "modules": ["schedule-coordination", "vaccine-demand-forecast"],
        "endpoints": {
            "AI1": "POST /api/v1/ai/schedule  (alias /api/v1/ai/dispatch)",
            "AI2": "POST /api/v1/ai/forecast",
        },
    }