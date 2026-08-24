package com.vaxcare.feature.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotLoadItem {
    private String time;
    private long count;
    private int pct;
    /** low | mid | high */
    private String level;
}