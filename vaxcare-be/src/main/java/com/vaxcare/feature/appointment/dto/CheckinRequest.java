package com.vaxcare.feature.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckinRequest {

    @NotBlank(message = "Mã QR không được để trống")
    private String qrCode;
}
