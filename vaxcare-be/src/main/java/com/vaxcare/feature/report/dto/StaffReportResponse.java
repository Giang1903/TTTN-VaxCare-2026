package com.vaxcare.feature.report.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffReportResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private int days;
    private Long facilityId;
    private String facilityName;

    private StaffReportKpi kpi;
    /** Daily series for chart (full range, or last 7 if range > 14 for compact week chart) */
    private List<DailyCountItem> dailySeries;
    /** Always last 7 days for dashboard week chart */
    private List<DailyCountItem> weekSeries;
    private List<VaccineRankItem> vaccineRanking;
    private List<ReactionSeverityItem> reactionMix;
    private long openReactions;
    /** Today's slot load (overload) */
    private List<TimeSlotLoadItem> todayOverload;
}