package com.vaxcare.feature.ai.client.dto;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ForecastPeriodDto {
    private LocalDate forecastPeriodStart;
    private LocalDate forecastPeriodEnd;
    private Integer predictedQuantity;
    private Double confidenceLevel;
    private Integer lowerBound;
    private Integer upperBound;
}
