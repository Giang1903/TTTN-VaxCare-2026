package com.vaxcare.feature.appointment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelAppointmentRequest {

    private String reason;
}
