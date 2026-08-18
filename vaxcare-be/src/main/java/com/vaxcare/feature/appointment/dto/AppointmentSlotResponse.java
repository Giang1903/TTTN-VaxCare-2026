package com.vaxcare.feature.appointment.dto;

import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentSlotResponse {

    private LocalTime timeSlot;
    private Integer capacity;
    private Integer bookedCount;
    private Integer availableCount;
    private Boolean full;
}
