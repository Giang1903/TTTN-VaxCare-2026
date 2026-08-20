package com.vaxcare.feature.appointment.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.CheckinRequest;
import com.vaxcare.feature.appointment.service.StaffAppointmentService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
@Tag(name = "15. Staff - Check-in", description = "Staff quét mã QR để check-in lịch hẹn tại quầy")
public class StaffCheckinController {

    private final StaffAppointmentService staffAppointmentService;

    @PostMapping("/checkin")
    public ApiResponse<AppointmentResponse> checkin(
            @Valid @RequestBody CheckinRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Check-in thành công",
                staffAppointmentService.checkin(request.getQrCode(), userPrincipal.getId()));
    }
}
