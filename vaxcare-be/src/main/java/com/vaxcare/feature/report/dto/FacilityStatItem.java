package com.vaxcare.feature.report.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FacilityStatItem {
    private Long facilityId;
    private String facilityName;
    private long appointments;
    private long completed;
    private long pending;
    private double completionRate;
    private java.math.BigDecimal revenue;
}