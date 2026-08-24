package com.vaxcare.feature.dashboard.dto;

import com.vaxcare.common.enums.VaccinationResult;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccinationResultCount {
    private VaccinationResult result;
    private long count;
}
