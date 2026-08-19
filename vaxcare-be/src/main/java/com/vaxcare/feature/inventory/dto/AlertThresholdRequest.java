package com.vaxcare.feature.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertThresholdRequest {

    @NotNull(message = "Ngưỡng cảnh báo không được để trống")
    @Min(value = 0, message = "Ngưỡng cảnh báo không được âm")
    private Integer alertThreshold;
}
