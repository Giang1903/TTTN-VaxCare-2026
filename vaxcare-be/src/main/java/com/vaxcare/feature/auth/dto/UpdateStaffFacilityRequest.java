package com.vaxcare.feature.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStaffFacilityRequest {

    @NotNull(message = "facilityId không được để trống")
    private Long facilityId;
}
