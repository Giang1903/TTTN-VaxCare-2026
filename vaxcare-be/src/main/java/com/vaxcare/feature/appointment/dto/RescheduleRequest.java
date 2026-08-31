package com.vaxcare.feature.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class RescheduleRequest {

    @NotNull(message = "Ngày hẹn không được để trống")
    private LocalDate appointmentDate;

    @NotNull(message = "Khung giờ không được để trống")
    private LocalTime timeSlot;
}
