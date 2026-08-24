package com.vaxcare.feature.report.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCountItem {
    private LocalDate date;
    private String label;
    private long count;
    /** 0–100 relative bar height */
    private int barHeight;
    private boolean today;
}