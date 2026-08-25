package com.vaxcare.feature.ai.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandForecastResponse {
    private Long forecastId;
    private Long vaccineId;
    private String vaccineName;
    private Long facilityId;
    private String facilityName;
    private LocalDate forecastPeriodStart;
    private LocalDate forecastPeriodEnd;
    private Integer predictedQuantity;
    private Integer actualQuantity;
    private BigDecimal confidenceLevel;
    private String modelVersion;
}
