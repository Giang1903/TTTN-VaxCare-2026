package com.vaxcare.feature.appointment.dto;

import com.vaxcare.common.enums.AppointmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {

    private Long appointmentId;
    private Long userId;
    private String userFullName;
    private Long facilityId;
    private String userPhone;
    private String facilityName;
    private Long vaccineId;
    private String vaccineName;
    private Long staffId;
    private String staffName;
    private BigDecimal price;
    private Boolean recommendedByAi;
    private Long predictionId;
    private LocalDate appointmentDate;
    private LocalTime timeSlot;
    private AppointmentStatus status;
    private String qrCode;
    private String note;
    private LocalDateTime createdAt;
}
