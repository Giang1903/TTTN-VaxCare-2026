package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.CreateRefundRequest;
import com.vaxcare.feature.appointment.dto.PaymentResponse;
import com.vaxcare.feature.appointment.dto.RefundResponse;
import com.vaxcare.feature.appointment.dto.VNPayUrlResponse;
import com.vaxcare.feature.appointment.dto.ZaloPayUrlResponse;
import com.vaxcare.feature.appointment.service.PaymentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "13. Payment", description = "Thanh toán VNPay / ZaloPay & Hoàn tiền")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-vnpay")
    @Operation(summary = "Tạo URL thanh toán VNPay")
    public ApiResponse<VNPayUrlResponse> createVnpayPaymentUrl(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest) {
        return ApiResponse.success("Tạo URL thanh toán VNPay thành công",
                paymentService.createVnpayPaymentUrl(userPrincipal.getId(), request, httpRequest));
    }

    @PostMapping("/create-zalopay")
    @Operation(summary = "Tạo URL thanh toán ZaloPay")
    public ApiResponse<ZaloPayUrlResponse> createZalopayPaymentUrl(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.success("Tạo URL thanh toán ZaloPay thành công",
                paymentService.createZalopayPaymentUrl(userPrincipal.getId(), request));
    }

    @GetMapping("/appointments/{appointmentId}")
    @Operation(summary = "Lấy thông tin thanh toán theo lịch hẹn")
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

    @PostMapping("/zalopay-callback")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "IPN callback từ ZaloPay (server-to-server)")
    public Map<String, Object> zalopayCallback(@RequestBody Map<String, Object> body) {
        return paymentService.handleZalopayCallback(body);
    }

    @GetMapping("/zalopay-return")
    @Operation(summary = "Redirect user về sau khi thanh toán ZaloPay")
    public void zalopayReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response)
            throws IOException {
        String redirectUrl = paymentService.handleZalopayReturn(allParams);
        response.sendRedirect(redirectUrl);
    }

    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
    @Operation(summary = "Tạo yêu cầu hoàn tiền (ADMIN / STAFF)")
    public ApiResponse<RefundResponse> createRefund(
            @PathVariable Long paymentId,
            @Valid @RequestBody CreateRefundRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Tạo yêu cầu hoàn tiền thành công",
                paymentService.refundPayment(
                        paymentId, request, userPrincipal.getId(), userPrincipal.getUsername()));
    }

    @GetMapping("/{paymentId}/refunds")
    @Operation(summary = "Lịch sử hoàn tiền của 1 payment")
    public ApiResponse<List<RefundResponse>> getRefundsByPayment(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy lịch sử hoàn tiền thành công",
                paymentService.getRefundsByPayment(paymentId, userPrincipal.getId()));
    }

    @GetMapping("/refunds/by-appointment/{appointmentId}")
    @Operation(summary = "Lịch sử hoàn tiền theo lịch hẹn")
    public ApiResponse<List<RefundResponse>> getRefundsByAppointment(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy lịch sử hoàn tiền thành công",
                paymentService.getRefundsByAppointment(appointmentId, userPrincipal.getId()));
    }

    @GetMapping("/refunds/{refundId}")
    @Operation(summary = "Chi tiết 1 yêu cầu hoàn tiền")
    public ApiResponse<RefundResponse> getRefundById(
            @PathVariable Long refundId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy chi tiết hoàn tiền thành công",
                paymentService.getRefundById(refundId, userPrincipal.getId()));
    }
}
