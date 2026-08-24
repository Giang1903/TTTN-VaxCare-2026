package com.vaxcare.feature.dashboard.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDashboardResponse {

    private Long facilityId;
    private String facilityName;
    private LocalDate date;
    private List<AppointmentStatusCount> appointmentsToday;
    private long totalVaccinationsToday;
    private List<VaccinationResultCount> vaccinationsTodayByResult;
    private List<VaccineStockItem> inventorySummary;
    private List<ExpiringBatchItem> expiringSoonBatches;
    private long unresolvedReactionsCount;
    private List<ReactionSeverityCount> unresolvedReactionsBySeverity;
}
