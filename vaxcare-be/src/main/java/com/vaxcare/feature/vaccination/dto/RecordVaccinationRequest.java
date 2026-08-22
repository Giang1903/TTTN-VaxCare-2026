package com.vaxcare.feature.vaccination.dto;

import com.vaxcare.common.enums.VaccinationResult;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordVaccinationRequest {

    @NotNull(message = "appointmentId không được để trống")
    private Long appointmentId;

    @Positive(message = "Số thứ tự mũi tiêm phải lớn hơn 0")
    private Integer doseNumber;

    private LocalDate injectionDate;

    @Builder.Default
    private VaccinationResult result = VaccinationResult.SUCCESS;

    private String note;
}
