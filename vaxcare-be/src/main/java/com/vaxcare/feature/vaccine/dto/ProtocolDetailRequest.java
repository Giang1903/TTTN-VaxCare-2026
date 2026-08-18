package com.vaxcare.feature.vaccine.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocolDetailRequest {

    @NotNull(message = "Số thứ tự mũi tiêm không được để trống")
    private Integer doseNumber;

    @PositiveOrZero(message = "Khoảng cách (ngày) không được âm")
    private Integer intervalDays;

    private Integer ageFromMonths;
    private Integer ageToMonths; // null = không giới hạn tuổi trên

    private String note;
}
