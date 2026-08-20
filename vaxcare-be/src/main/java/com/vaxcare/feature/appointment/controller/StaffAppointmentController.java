package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.service.StaffAppointmentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
@Tag(name = "14. Staff - Appointment Management", description = "Staff/Admin xem, lọc, xác nhận, hủy lịch hẹn")
public class StaffAppointmentController {

    private final StaffAppointmentService staffAppointmentService;

    @GetMapping
    public ApiResponse<List<AppointmentResponse>> searchAppointments(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(description = "Chỉ ADMIN dùng được filter này; STAFF luôn bị ép về cơ sở của mình")
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status,
            @Parameter(description = "Tìm theo tên hoặc số điện thoại người đặt lịch")
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success("Lấy danh sách lịch hẹn thành công",
                staffAppointmentService.searchAppointments(userPrincipal.getId(), facilityId, date, status, keyword));
    }

    @PatchMapping("/{id}/confirm")
    public ApiResponse<AppointmentResponse> confirmAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Xác nhận lịch hẹn thành công",
                staffAppointmentService.confirmAppointment(id, userPrincipal.getId()));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody CancelAppointmentRequest request) {
        return ApiResponse.success("Hủy lịch hẹn thành công",
                staffAppointmentService.cancelAppointment(id, userPrincipal.getId(), request));
    }
}
