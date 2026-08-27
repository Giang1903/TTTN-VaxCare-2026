from __future__ import annotations

from typing import Dict, List, Optional

from src.api.schemas import DispatchRequest, DispatchResponse, SlotPrediction
from src.scheduling.forecaster import predict_bookings_per_slot
from src.scheduling.xgb_model import model_version, predict_wait_and_overload

_RECOMMEND_THRESHOLD = 0.35
_MAX_RECOMMENDATIONS = 3


def score_dispatch(request: DispatchRequest) -> DispatchResponse:
    predicted_by_slot: Dict = predict_bookings_per_slot(request)

    day_of_week = request.prediction_date.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    is_holiday = 0

    slot_predictions: List[SlotPrediction] = []
    for time_slot, predicted in predicted_by_slot.items():
        wait_minutes, probability = predict_wait_and_overload(
            day_of_week=day_of_week,
            is_weekend=is_weekend,
            is_holiday=is_holiday,
            hour=time_slot.hour,
            capacity=request.capacity_per_slot,
            booked=predicted,
        )
        slot_predictions.append(
            SlotPrediction(
                time_slot=time_slot,
                predicted_bookings=predicted,
                capacity=request.capacity_per_slot,
                overload_probability=probability,
                estimated_wait_minutes=wait_minutes,
                recommended=probability < _RECOMMEND_THRESHOLD,
            )
        )

    slot_predictions.sort(key=lambda s: s.time_slot)

    quiet_first = sorted(slot_predictions, key=lambda s: s.overload_probability)
    recommended_slots = [
        s.time_slot for s in quiet_first if s.recommended
    ][:_MAX_RECOMMENDATIONS]
    if not recommended_slots and quiet_first:
        recommended_slots = [quiet_first[0].time_slot]

    most_overloaded: Optional = None
    if slot_predictions:
        most_overloaded = max(
            slot_predictions, key=lambda s: s.overload_probability
        ).time_slot

    return DispatchResponse(
        facility_id=request.facility_id,
        prediction_date=request.prediction_date,
        slots=slot_predictions,
        recommended_slots=recommended_slots,
        most_overloaded_slot=most_overloaded,
        model_version=model_version(),
    )
