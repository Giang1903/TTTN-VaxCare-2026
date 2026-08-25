package com.vaxcare.feature.ai.client.dto;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class DispatchRequestDto {

    private Long facilityId;
    private LocalDate predictionDate;
    private Integer capacityPerSlot;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Integer slotDurationMinutes;
    private Double avgServiceMinutes;

    @Builder.Default
    private List<SlotBookingDto> currentBookings = List.of();

    @Builder.Default
    private List<HistoricalSlotStatDto> historicalStats = List.of();
}
