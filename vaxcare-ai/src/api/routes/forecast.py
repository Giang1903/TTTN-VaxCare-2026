from fastapi import APIRouter, HTTPException

from src.api.schemas import ForecastRequest, ForecastResponse
from src.inventory.forecaster import forecast_demand

router = APIRouter(prefix="/api/v1/ai", tags=["AI 2 - Forecast"])


@router.post("/forecast", response_model=ForecastResponse, summary="Dự báo nhu cầu tiêu thụ vắc xin")
def forecast(request: ForecastRequest) -> ForecastResponse:
   
    try:
        return forecast_demand(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
