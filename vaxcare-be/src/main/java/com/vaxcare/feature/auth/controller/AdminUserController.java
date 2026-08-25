package com.vaxcare.feature.auth.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.dto.*;
import com.vaxcare.feature.auth.service.AdminUserService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "22. Admin - User Management", description = "Quản lý tài khoản User / Nhân viên y tế / Admin")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<List<AccountResponse>> searchUsers(
            @Parameter(description = "Lọc theo vai trò") @RequestParam(required = false) Role role,
            @Parameter(description = "Lọc theo trạng thái tài khoản") @RequestParam(required = false) AccountStatus status,
            @Parameter(description = "Tìm theo email, số điện thoại hoặc họ tên") @RequestParam(required = false) String keyword) {
        return ApiResponse.success("Lấy danh sách tài khoản thành công",
                adminUserService.searchUsers(role, status, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminAccountDetailResponse> getUserDetail(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết tài khoản thành công", adminUserService.getUserDetail(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AccountResponse> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateAccountStatusRequest request) {
        return ApiResponse.success("Cập nhật trạng thái tài khoản thành công",
                adminUserService.updateAccountStatus(id, userPrincipal.getId(), request.getStatus()));
    }

    @PostMapping("/staff")
    public ApiResponse<AccountResponse> createStaffAccount(@Valid @RequestBody CreateStaffAccountRequest request) {
        return ApiResponse.success("Tạo tài khoản nhân viên y tế thành công",
                adminUserService.createStaffAccount(request));
    }

    @PatchMapping("/staff/{staffId}/facility")
    public ApiResponse<AdminAccountDetailResponse> updateStaffFacility(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateStaffFacilityRequest request) {
        return ApiResponse.success("Chuyển cơ sở tiêm chủng cho nhân viên thành công",
                adminUserService.updateStaffFacility(staffId, request.getFacilityId()));
    }

    @PostMapping("/admin")
    public ApiResponse<AccountResponse> createAdminAccount(@Valid @RequestBody CreateAdminAccountRequest request) {
        return ApiResponse.success("Tạo tài khoản quản trị viên thành công",
                adminUserService.createAdminAccount(request));
    }
}
