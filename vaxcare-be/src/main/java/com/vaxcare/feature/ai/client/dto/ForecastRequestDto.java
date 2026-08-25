package com.vaxcare.feature.ai.client.dto;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ForecastRequestDto {
    private Long vaccineId;
    private Long facilityId;
    private List<ConsumptionPointDto> history;
    private Integer horizonDays;
    private Integer periodDays;
}
