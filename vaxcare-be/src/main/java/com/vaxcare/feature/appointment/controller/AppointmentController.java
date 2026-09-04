package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.appointment.dto.AppointmentRequest;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.dto.RescheduleRequest;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.AppointmentSlotResponse;
import com.vaxcare.feature.appointment.dto.QrCodeResponse;
import com.vaxcare.feature.appointment.service.AppointmentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "12. Appointment", description = "Đặt / đổi lịch hẹn tiêm chủng (đổi ngày-giờ) và tra cứu khung giờ trống")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/available-slots")
    public ApiResponse<List<AppointmentSlotResponse>> getAvailableSlots(
            @Parameter(description = "ID cơ sở tiêm chủng") @RequestParam Long facilityId,
            @Parameter(description = "Ngày muốn đặt lịch (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Lấy danh sách khung giờ trống thành công",
                appointmentService.getAvailableSlots(facilityId, date));
    }

    @GetMapping
    public ApiResponse<List<AppointmentResponse>> getMyAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách lịch hẹn thành công",
                appointmentService.getMyAppointments(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<AppointmentResponse> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy chi tiết lịch hẹn thành công",
                appointmentService.getAppointmentById(id, userPrincipal.getId()));
    }

    @GetMapping("/{id}/qr-code")
    public ApiResponse<QrCodeResponse> getQrCode(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy mã QR lịch hẹn thành công",
                appointmentService.getQrCode(id, userPrincipal.getId()));
    }

    @PostMapping
    public ApiResponse<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AppointmentRequest request) {
        return ApiResponse.success("Đặt lịch hẹn thành công",
                appointmentService.bookAppointment(userPrincipal.getId(), request));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) CancelAppointmentRequest request) {
        return ApiResponse.success("Hủy lịch hẹn thành công. Slot đã được trả lại. Lịch đã thanh toán sẽ không được hoàn tiền.",
                appointmentService.cancelAppointment(id, userPrincipal.getId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AppointmentResponse> rescheduleAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RescheduleRequest request) {
        return ApiResponse.success("Đổi lịch hẹn thành công",
                appointmentService.rescheduleAppointment(id, userPrincipal.getId(), request));
    }

}