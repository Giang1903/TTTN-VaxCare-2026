package com.vaxcare.feature.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffReportKpi {
    private long appointments;
    private long completed;
    private long cancelled;
    private long checkedIn;
    private long pending;
    private long confirmed;
    /** completion rate 0–100 */
    private double completionRate;
}