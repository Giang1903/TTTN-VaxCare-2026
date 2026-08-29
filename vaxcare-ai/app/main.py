from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import schedule

app = FastAPI(
    title="VaxCare AI Service – Schedule Coordination",
    description="Gợi ý và xếp hạng khung giờ tiêm dựa trên dự đoán thời gian chờ và nguy cơ quá tải.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router)


@app.get("/", tags=["Health"])
def health():
    return {
        "status": "UP",
        "service": "vaxcare-ai-service",
        "module": "schedule-coordination",
    }
