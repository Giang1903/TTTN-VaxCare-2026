package com.vaxcare.feature.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {

    private LocalDate from;
    private LocalDate to;
    private long totalUsers;
    private long totalMedicalStaff;
    private long totalActiveFacilities;
    private long totalActiveVaccines;
    private BigDecimal totalRevenue;
    private List<RevenuePoint> revenueTrend;
    private long totalVaccinations;
    private List<AppointmentStatusCount> appointmentsByStatus;
    private List<StockVsForecastItem> stockVsForecast;
}
