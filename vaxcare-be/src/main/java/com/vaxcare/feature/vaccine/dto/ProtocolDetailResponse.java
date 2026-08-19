package com.vaxcare.feature.vaccine.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocolDetailResponse {

    private Long protocolDetailId;
    private Integer doseNumber;
    private Integer intervalDays;
    private Integer ageFromMonths;
    private Integer ageToMonths;
    private String note;
}
