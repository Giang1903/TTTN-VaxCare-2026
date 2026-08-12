package com.vaxcare.feature.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentRequest {

    @NotNull(message = "Cơ sở tiêm không được để trống")
    private Long facilityId;

    @NotNull(message = "Vắc xin không được để trống")
    private Long vaccineId;

    @NotNull(message = "Ngày hẹn không được để trống")
    private LocalDate appointmentDate;

    @NotNull(message = "Khung giờ không được để trống")
    private LocalTime timeSlot;

    private String note;
}
