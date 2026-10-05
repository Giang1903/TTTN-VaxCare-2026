package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.MoMoUrlResponse;
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
@Tag(name = "13. Payment", description = "Thanh toán VNPay / MoMo cho lịch hẹn")
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

    @PostMapping("/create-momo")
    public ApiResponse<MoMoUrlResponse> createMomoPaymentUrl(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.success("Tạo URL thanh toán MoMo thành công",
                paymentService.createMomoPaymentUrl(userPrincipal.getId(), request));
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

    @GetMapping("/momo-return")
    public void momoReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response)
            throws IOException {
        String redirectUrl = paymentService.handleMomoReturn(allParams);
        response.sendRedirect(redirectUrl);
    }

    @PostMapping("/momo-ipn")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Map<String, Object> momoIpn(@RequestBody(required = false) Map<String, Object> body,
                                       @RequestParam Map<String, String> queryParams) {
        Map<String, String> params = new java.util.HashMap<>(queryParams);
        if (body != null) {
            body.forEach((k, v) -> {
                if (v != null) {
                    params.put(k, String.valueOf(v));
                }
            });
        }
        return paymentService.handleMomoIpn(params);
    }
}
