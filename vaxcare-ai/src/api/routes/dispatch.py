from fastapi import APIRouter

from src.api.schemas import DispatchRequest, DispatchResponse
from src.scheduling.ranker import score_dispatch

router = APIRouter(prefix="/api/v1/ai", tags=["AI 1 - Dispatch"])


@router.post("/dispatch", response_model=DispatchResponse, summary="Chấm điểm quá tải & gợi ý khung giờ vắng")
def dispatch(request: DispatchRequest) -> DispatchResponse:
    
    return score_dispatch(request)
