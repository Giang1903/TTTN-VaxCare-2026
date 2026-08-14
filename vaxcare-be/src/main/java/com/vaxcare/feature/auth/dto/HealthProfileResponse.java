package com.vaxcare.feature.auth.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthProfileResponse {

    private Long profileId;
    private Long userId;
    private String userFullName;
    private BigDecimal height;
    private BigDecimal weight;
    private String medicalHistory;
    private String allergies;
    private String note;
    private LocalDateTime updatedAt;
}
