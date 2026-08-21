package com.vaxcare.feature.appointment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VNPayUrlResponse {

    /** URL FE cần redirect trình duyệt người dùng sang để thực hiện thanh toán trên cổng VNPay. */
    private String paymentUrl;

    private Long paymentId;

    private String txnRef;
}
