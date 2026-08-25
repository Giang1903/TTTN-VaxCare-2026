from __future__ import annotations

import math
from typing import Dict, List, Optional

from src.api.schemas import DispatchRequest, DispatchResponse, SlotPrediction
from src.scheduling.forecaster import predict_bookings_per_slot

# Ngưỡng tỉ lệ lấp đầy được coi là "bắt đầu có nguy cơ quá tải".
_OVERLOAD_MIDPOINT_RATIO = 0.8
# Độ dốc của sigmoid quanh ngưỡng trên.
_SIGMOID_STEEPNESS = 6.0
# Một khung giờ được gợi ý ("vắng") nếu overload_probability dưới ngưỡng này.
_RECOMMEND_THRESHOLD = 0.35
# Số lượng khung giờ tối đa được gợi ý.
_MAX_RECOMMENDATIONS = 3


def _overload_probability(predicted: int, capacity: int) -> float:
    if capacity <= 0:
        return 1.0
    ratio = predicted / capacity
    # sigmoid(ratio) quanh mốc _OVERLOAD_MIDPOINT_RATIO
    exponent = -_SIGMOID_STEEPNESS * (ratio - _OVERLOAD_MIDPOINT_RATIO)
    probability = 1.0 / (1.0 + math.exp(exponent))
    return round(min(1.0, max(0.0, probability)), 4)


def _estimated_wait_minutes(
    predicted: int, capacity: int, slot_duration_minutes: int, avg_service_minutes: float
) -> int:
    if capacity <= 0:
        return slot_duration_minutes
    service_rate_per_minute = capacity / slot_duration_minutes  # người/phút mà khung giờ xử lý được
    if predicted <= capacity:
        # Chờ trong hàng ngắn nội bộ khung giờ, tỉ lệ với độ lấp đầy.
        wait = (predicted / capacity) * (slot_duration_minutes / 2)
    else:
        overflow = predicted - capacity
        extra_wait = overflow / service_rate_per_minute if service_rate_per_minute > 0 else overflow * avg_service_minutes
        wait = (slot_duration_minutes / 2) + extra_wait
    return int(round(wait))


def score_dispatch(request: DispatchRequest) -> DispatchResponse:
    predicted_by_slot: Dict = predict_bookings_per_slot(request)

    slot_predictions: List[SlotPrediction] = []
    for time_slot, predicted in predicted_by_slot.items():
        probability = _overload_probability(predicted, request.capacity_per_slot)
        wait_minutes = _estimated_wait_minutes(
            predicted,
            request.capacity_per_slot,
            request.slot_duration_minutes,
            request.avg_service_minutes,
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

    # Xếp hạng khung giờ vắng nhất (probability thấp nhất) để gợi ý cho user.
    quiet_first = sorted(slot_predictions, key=lambda s: s.overload_probability)
    recommended_slots = [
        s.time_slot for s in quiet_first if s.recommended
    ][:_MAX_RECOMMENDATIONS]
    if not recommended_slots and quiet_first:
        # Không có khung nào dưới ngưỡng -> vẫn gợi ý khung ít tải nhất hiện có.
        recommended_slots = [quiet_first[0].time_slot]

    most_overloaded: Optional = None
    if slot_predictions:
        most_overloaded = max(slot_predictions, key=lambda s: s.overload_probability).time_slot

    return DispatchResponse(
        facility_id=request.facility_id,
        prediction_date=request.prediction_date,
        slots=slot_predictions,
        recommended_slots=recommended_slots,
        most_overloaded_slot=most_overloaded,
    )
