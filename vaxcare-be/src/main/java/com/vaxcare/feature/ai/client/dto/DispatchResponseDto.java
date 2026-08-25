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
public class DispatchResponseDto {
    private Long facilityId;
    private LocalDate predictionDate;
    private List<SlotPredictionDto> slots;
    private List<LocalTime> recommendedSlots;
    private LocalTime mostOverloadedSlot;
    private String modelVersion;
}
