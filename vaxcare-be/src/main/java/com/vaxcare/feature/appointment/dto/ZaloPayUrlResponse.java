package com.vaxcare.feature.appointment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZaloPayUrlResponse {
    private String paymentUrl;
    private Long paymentId;
    private String appTransId;
    private String orderToken;
}
