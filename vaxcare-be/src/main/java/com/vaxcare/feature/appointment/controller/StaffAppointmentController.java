package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.service.AppointmentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
@Tag(name = "13. Staff - Appointment Management", description = "Nhân viên y tế / Admin xem, lọc, xác nhận và hủy lịch hẹn")
public class StaffAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ApiResponse<List<AppointmentResponse>> getAppointmentsForStaff(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(description = "Chỉ áp dụng cho ADMIN; MEDICAL_STAFF sẽ luôn bị giới hạn theo cơ sở của mình")
            @RequestParam(required = false) Long facilityId,
            @Parameter(description = "Lọc theo trạng thái lịch hẹn") @RequestParam(required = false) AppointmentStatus status,
            @Parameter(description = "Từ ngày (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "Đến ngày (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ApiResponse.success("Lấy danh sách lịch hẹn thành công",
                appointmentService.getAppointmentsForStaff(userPrincipal.getId(), facilityId, status, fromDate, toDate));
    }

    @PatchMapping("/{id}/confirm")
    public ApiResponse<AppointmentResponse> confirmAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Xác nhận lịch hẹn thành công",
                appointmentService.confirmAppointment(id, userPrincipal.getId()));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CancelAppointmentRequest request) {
        return ApiResponse.success("Hủy lịch hẹn thành công",
                appointmentService.staffCancelAppointment(id, userPrincipal.getId(), request));
    }
}
