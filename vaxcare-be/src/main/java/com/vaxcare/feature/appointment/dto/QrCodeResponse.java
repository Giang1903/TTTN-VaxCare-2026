package com.vaxcare.feature.appointment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrCodeResponse {

    private Long appointmentId;

    /** Token gốc lưu trong DB (appointments.qr_code) - dùng để đối chiếu khi Staff check-in thủ công nếu máy quét lỗi. */
    private String qrCodeToken;

    /** Ảnh QR dạng data URI Base64 (data:image/png;base64,...), FE render trực tiếp bằng thẻ <img src="..."/>. */
    private String qrCodeImageBase64;
}
