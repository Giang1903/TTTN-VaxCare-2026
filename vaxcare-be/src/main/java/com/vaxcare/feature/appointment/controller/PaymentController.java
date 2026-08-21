package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.PaymentResponse;
import com.vaxcare.feature.appointment.dto.VNPayUrlResponse;
import com.vaxcare.feature.appointment.service.PaymentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "13. Payment", description = "Thanh toán lịch hẹn qua cổng VNPay (Sandbox)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-vnpay")
    public ApiResponse<VNPayUrlResponse> createVnpayPaymentUrl(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest) {
        return ApiResponse.success("Tạo URL thanh toán VNPay thành công",
                paymentService.createVnpayPaymentUrl(userPrincipal.getId(), request, httpRequest));
    }

    @GetMapping("/appointments/{appointmentId}")
    public ApiResponse<PaymentResponse> getPaymentByAppointment(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy thông tin thanh toán thành công",
                paymentService.getPaymentByAppointment(appointmentId, userPrincipal.getId()));
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response)
            throws IOException {
        String redirectUrl = paymentService.handleReturn(allParams);
        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/vnpay-ipn")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> vnpayIpn(@RequestParam Map<String, String> allParams) {
        return paymentService.handleIpn(allParams);
    }
}
