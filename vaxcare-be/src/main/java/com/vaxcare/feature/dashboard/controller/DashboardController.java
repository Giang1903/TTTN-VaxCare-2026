package com.vaxcare.feature.dashboard.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.dashboard.dto.AdminDashboardResponse;
import com.vaxcare.feature.dashboard.dto.StaffDashboardResponse;
import com.vaxcare.feature.dashboard.dto.UserDashboardResponse;
import com.vaxcare.feature.dashboard.service.DashboardService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "21. Dashboard", description = "Dashboard tổng hợp cho User / Staff / Admin")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<UserDashboardResponse> getUserDashboard(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy dashboard người dùng thành công",
                dashboardService.getUserDashboard(userPrincipal.getId()));
    }

    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
    public ApiResponse<StaffDashboardResponse> getStaffDashboard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(description = "Chỉ ADMIN dùng được filter này; STAFF luôn bị ép về cơ sở của mình")
            @RequestParam(required = false) Long facilityId,
            @Parameter(description = "Ngày muốn xem thống kê (mặc định hôm nay)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Lấy dashboard nhân viên y tế thành công",
                dashboardService.getStaffDashboard(userPrincipal.getId(), facilityId, date));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminDashboardResponse> getAdminDashboard(
            @Parameter(description = "Mặc định = đầu tháng hiện tại")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Mặc định = hôm nay")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success("Lấy dashboard quản trị thành công",
                dashboardService.getAdminDashboard(from, to));
    }
}
