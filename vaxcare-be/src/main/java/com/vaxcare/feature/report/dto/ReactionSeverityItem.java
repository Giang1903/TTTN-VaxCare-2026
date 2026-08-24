package com.vaxcare.feature.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionSeverityItem {
    private String severity;
    private String label;
    private long count;
    private double pct;
}