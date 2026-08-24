package com.vaxcare.feature.dashboard.dto;

import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDashboardResponse {

    private long totalAppointments;
    private long totalVaccinationsCompleted;
    private long unreadNotifications;
    private List<AppointmentResponse> upcomingAppointments;
    private List<VaccinationDetailResponse> recentVaccinations;
}
