package com.vaxcare.feature.vaccine.dto;

import com.vaxcare.common.enums.ActiveStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineRequest {

    private Long categoryId;

    @NotBlank(message = "Tên vắc xin không được để trống")
    private String vaccineName;

    private String manufacturer;
    private String targetDisease;
    private Integer requiredDoses;
    private Integer doseIntervalDays;
    private String description;
    private String imageUrl;
    private ActiveStatus status;
}
