package com.vaxcare.feature.facility.dto;

import com.vaxcare.common.enums.ActiveStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityRequest {

    @NotBlank(message = "Tên cơ sở không được để trống")
    private String facilityName;

    private String address;
    private String phone;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Integer capacityPerSlot;
    private String imageUrl;
    private ActiveStatus status;
}
