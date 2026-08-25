package com.vaxcare.feature.auth.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.dto.AdminAccountItemResponse;
import com.vaxcare.feature.auth.dto.CreateStaffRequest;
import jakarta.validation.Valid;
import com.vaxcare.feature.auth.service.AdminAccountService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "20. Admin - Accounts", description = "Admin xem danh sách user/staff và đổi trạng thái tài khoản")
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    @GetMapping("/users")
    public ApiResponse<List<AdminAccountItemResponse>> listUsers() {
        return ApiResponse.success("Lấy danh sách người dùng thành công",
                adminAccountService.listByRole(Role.USER));
    }

    @GetMapping("/staff")
    public ApiResponse<List<AdminAccountItemResponse>> listStaff() {
        return ApiResponse.success("Lấy danh sách nhân viên y tế thành công",
                adminAccountService.listByRole(Role.MEDICAL_STAFF));
    }

    @PostMapping("/staff")
    public ApiResponse<AdminAccountItemResponse> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return ApiResponse.success("Tạo nhân viên y tế thành công",
                adminAccountService.createStaff(request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminAccountItemResponse> updateStatus(
            @PathVariable Long id,
            @Parameter(description = "ACTIVE | INACTIVE | LOCKED ...")
            @RequestBody Map<String, String> body) {
        AccountStatus status = AccountStatus.valueOf(body.get("status"));
        return ApiResponse.success("Cập nhật trạng thái tài khoản thành công",
                adminAccountService.updateStatus(id, status));
    }
}