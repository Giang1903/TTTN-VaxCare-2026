package com.vaxcare.feature.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRefundRequest {
    
    private BigDecimal amount;
    @NotBlank(message = "Lý do hoàn tiền / hủy lịch không được để trống")
    @Size(max = 500)
    private String reason;
}
