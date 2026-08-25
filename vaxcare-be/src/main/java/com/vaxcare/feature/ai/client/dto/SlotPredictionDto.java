package com.vaxcare.feature.ai.client.dto;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SlotPredictionDto {
    private LocalTime timeSlot;
    private Integer predictedBookings;
    private Integer capacity;
    private Double overloadProbability;
    private Integer estimatedWaitMinutes;
    private Boolean recommended;
}
