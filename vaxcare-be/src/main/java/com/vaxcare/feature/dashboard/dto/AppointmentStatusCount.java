package com.vaxcare.feature.dashboard.dto;

import com.vaxcare.common.enums.AppointmentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentStatusCount {
    private AppointmentStatus status;
    private long count;
}
