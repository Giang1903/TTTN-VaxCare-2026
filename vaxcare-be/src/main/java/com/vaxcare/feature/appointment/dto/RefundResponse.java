package com.vaxcare.feature.appointment.dto;

import com.vaxcare.common.enums.RefundStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundResponse {
    private Long refundId;
    private Long paymentId;
    private Long appointmentId;
    private String requestId;
    private BigDecimal amount;
    private String reason;
    private RefundStatus status;
    private String gatewayRefundId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime refundedAt;
}
