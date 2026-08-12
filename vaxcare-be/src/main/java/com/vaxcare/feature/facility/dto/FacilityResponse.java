package com.vaxcare.feature.facility.dto;

import com.vaxcare.common.enums.ActiveStatus;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityResponse {

    private Long facilityId;
    private String facilityName;
    private String address;
    private String phone;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Integer capacityPerSlot;
    private String imageUrl;
    private ActiveStatus status;
}
