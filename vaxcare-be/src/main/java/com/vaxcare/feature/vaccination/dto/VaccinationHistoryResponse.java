package com.vaxcare.feature.vaccination.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccinationHistoryResponse {

    private Long historyId;
    private Long userId;
    private String userFullName;
    private int totalDoses;
    private List<VaccinationDetailResponse> details;
}
