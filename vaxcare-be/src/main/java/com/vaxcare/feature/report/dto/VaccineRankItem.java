package com.vaxcare.feature.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineRankItem {
    private int rank;
    private Long vaccineId;
    private String vaccineName;
    private long shots;
    private double pct;
    private String tag;
}