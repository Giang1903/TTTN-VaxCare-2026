from fastapi import APIRouter

from app.schemas.schedule import ScheduleRequest, ScheduleResponse
from app.services.schedule_service import rank_slots

router = APIRouter(prefix="/api/v1/ai", tags=["Schedule coordination"])

@router.post(
    "/schedule",
    response_model=ScheduleResponse,
    summary="Xếp hạng khung giờ tiêm theo thời gian chờ và quá tải",
)
def schedule_rank(request: ScheduleRequest) -> ScheduleResponse:
    return rank_slots(request)

@router.post(
    "/dispatch",
    response_model=ScheduleResponse,
    summary="Alias /dispatch",
)
def dispatch_alias(request: ScheduleRequest) -> ScheduleResponse:
    return rank_slots(request)
