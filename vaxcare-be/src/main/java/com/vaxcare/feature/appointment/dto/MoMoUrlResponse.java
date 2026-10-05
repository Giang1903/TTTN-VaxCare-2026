package com.vaxcare.feature.appointment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoMoUrlResponse {
    private String paymentUrl;
    private Long paymentId;
    private String orderId;
}
