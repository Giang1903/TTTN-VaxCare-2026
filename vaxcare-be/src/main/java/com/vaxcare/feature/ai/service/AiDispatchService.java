package com.vaxcare.feature.ai.service;

import com.vaxcare.feature.ai.client.AiServiceClient;
import com.vaxcare.feature.ai.client.dto.DispatchRequestDto;
import com.vaxcare.feature.ai.client.dto.DispatchResponseDto;
import com.vaxcare.feature.ai.client.dto.HistoricalSlotStatDto;
import com.vaxcare.feature.ai.client.dto.SlotBookingDto;
import com.vaxcare.feature.ai.client.dto.SlotPredictionDto;
import com.vaxcare.feature.ai.entity.ScheduleOverloadPrediction;
import com.vaxcare.feature.ai.repository.ScheduleOverloadPredictionRepository;
import com.vaxcare.feature.appointment.dto.AppointmentSlotResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiDispatchService {

    private static final int HISTORY_WEEKS = 8;
    private static final int SLOT_DURATION_MINUTES = 30;
    private static final double AVG_SERVICE_MINUTES = 10.0;
    private static final double RECOMMENDED_OVERLOAD_THRESHOLD = 0.35;
    private final AiServiceClient aiServiceClient;
    private final AppointmentRepository appointmentRepository;
    private final ScheduleOverloadPredictionRepository predictionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<AppointmentSlotResponse> annotateSlots(VaccinationFacility facility, LocalDate date,
                                                         List<AppointmentSlotResponse> baseSlots) {
        if (baseSlots.isEmpty()) {
            return baseSlots;
        }

        DispatchRequestDto request = buildDispatchRequest(facility, date, baseSlots);

        Optional<DispatchResponseDto> responseOpt = aiServiceClient.getDispatchPrediction(request);
        if (responseOpt.isEmpty()) {
            return baseSlots;
        }

        DispatchResponseDto response = responseOpt.get();
        Map<LocalTime, SlotPredictionDto> predictionBySlot = response.getSlots().stream()
                .collect(Collectors.toMap(SlotPredictionDto::getTimeSlot, Function.identity(), (a, b) -> a));

        persistPredictions(facility, date, response.getSlots());

        return baseSlots.stream()
                .map(slot -> {
                    SlotPredictionDto prediction = predictionBySlot.get(slot.getTimeSlot());
                    if (prediction == null) {
                        return slot;
                    }
                    slot.setAiOverloadProbability(prediction.getOverloadProbability());
                    slot.setAiEstimatedWaitMinutes(prediction.getEstimatedWaitMinutes());
                    slot.setAiRecommended(Boolean.TRUE.equals(prediction.getRecommended()));
                    return slot;
                })
                .toList();
    }

    public void applyAiMetadataOnBooking(Appointment appointment) {
        predictionRepository.findByFacility_FacilityIdAndPredictionDateAndTimeSlot(
                        appointment.getFacility().getFacilityId(),
                        appointment.getAppointmentDate(),
                        appointment.getTimeSlot())
                .ifPresent(prediction -> {
                    appointment.setPredictionId(prediction.getPredictionId());
                    boolean recommended = prediction.getOverloadProbability() != null
                            && prediction.getOverloadProbability().doubleValue() < RECOMMENDED_OVERLOAD_THRESHOLD;
                    appointment.setRecommendedByAi(recommended);
                });
    }

    private DispatchRequestDto buildDispatchRequest(VaccinationFacility facility, LocalDate date,
                                                      List<AppointmentSlotResponse> baseSlots) {
        List<SlotBookingDto> currentBookings = baseSlots.stream()
                .map(slot -> SlotBookingDto.builder()
                        .timeSlot(slot.getTimeSlot())
                        .bookedCount(slot.getBookedCount())
                        .build())
                .toList();

        LocalDate fromDate = date.minusWeeks(HISTORY_WEEKS);
        LocalDate toDate = date.minusDays(1).isBefore(fromDate) ? fromDate : date.minusDays(1);
        List<HistoricalSlotStatDto> historicalStats = appointmentRepository
                .findHistoricalSlotStats(facility.getFacilityId(), fromDate, toDate).stream()
                .map(row -> HistoricalSlotStatDto.builder()
                        .dayOfWeek(((Number) row[0]).intValue())
                        .timeSlot(toLocalTime(row[1]))
                        .avgBookings(((Number) row[2]).doubleValue())
                        .build())
                .toList();

        return DispatchRequestDto.builder()
                .facilityId(facility.getFacilityId())
                .predictionDate(date)
                .capacityPerSlot(facility.getCapacityPerSlot())
                .openingTime(facility.getOpeningTime())
                .closingTime(facility.getClosingTime())
                .slotDurationMinutes(SLOT_DURATION_MINUTES)
                .avgServiceMinutes(AVG_SERVICE_MINUTES)
                .currentBookings(currentBookings)
                .historicalStats(historicalStats)
                .build();
    }

    private void persistPredictions(VaccinationFacility facility, LocalDate date, List<SlotPredictionDto> slots) {
        try {
            predictionRepository.deleteByFacilityAndDate(facility.getFacilityId(), date);
            List<ScheduleOverloadPrediction> entities = slots.stream()
                    .map(s -> ScheduleOverloadPrediction.builder()
                            .facility(facility)
                            .predictionDate(date)
                            .timeSlot(s.getTimeSlot())
                            .predictedBookings(s.getPredictedBookings())
                            .capacity(s.getCapacity())
                            .overloadProbability(s.getOverloadProbability() != null
                                    ? BigDecimal.valueOf(s.getOverloadProbability()) : null)
                            .estimatedWaitMinutes(s.getEstimatedWaitMinutes())
                            .build())
                    .toList();
            predictionRepository.saveAll(entities);
        } catch (Exception ex) {
            // Không để lỗi lưu prediction làm fail việc tra cứu khung giờ của User
            log.warn("[AI Service] Không thể lưu schedule_overload_predictions cho facility {} ngày {}: {}",
                    facility.getFacilityId(), date, ex.getMessage());
        }
    }

    private LocalTime toLocalTime(Object value) {
        if (value instanceof LocalTime lt) {
            return lt;
        }
        if (value instanceof java.sql.Time t) {
            return t.toLocalTime();
        }
        if (value instanceof java.time.LocalDateTime ldt) {
            return ldt.toLocalTime();
        }
        return LocalTime.parse(value.toString());
    }
}
