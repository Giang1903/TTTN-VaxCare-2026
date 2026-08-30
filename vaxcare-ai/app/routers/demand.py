from fastapi import APIRouter

from app.schemas.demand import ForecastRequest, ForecastResponse
from app.services.demand_service import forecast_demand

router = APIRouter(prefix="/api/v1/ai", tags=["Vaccine demand forecast"])


@router.post(
    "/forecast",
    response_model=ForecastResponse,
    summary="Dự báo nhu cầu vắc xin theo lịch sử tiêu thụ",
    description=(
        "Nhận chuỗi lịch sử tiêu thụ (ngày–số lượng) và trả về dự báo theo từng "
        "khoảng period_days trong horizon_days ngày tới. "
        "Dùng model XGBoost nếu có, ngược lại fallback heuristic."
    ),
)
def forecast(request: ForecastRequest) -> ForecastResponse:
    return forecast_demand(request)
