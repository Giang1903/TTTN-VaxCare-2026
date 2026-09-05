package com.vaxcare.feature.appointment.dto;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.PaymentStatus;
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

    /** Trạng thái thanh toán gắn với lịch (null nếu chưa có bản ghi payment) */
    private PaymentStatus paymentStatus;

    /** true khi paymentStatus == SUCCESS */
    private Boolean paid;

    private LocalDateTime cancelledAt;
    private String cancellationReason;

    /** true nếu lịch này được đặt lại miễn phí sau mũi FAILED */
    private Boolean freeRebook;

    private String freeRebookMessage;
}
