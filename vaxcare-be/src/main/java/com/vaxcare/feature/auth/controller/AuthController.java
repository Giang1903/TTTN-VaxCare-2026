package com.vaxcare.feature.auth.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.auth.dto.*;
import com.vaxcare.feature.auth.service.AuthService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication", description = "Đăng ký, đăng nhập, làm mới token, thông tin tài khoản hiện tại")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AccountResponse> register(@Valid @RequestBody RegisterRequest request) {
        AccountResponse response = authService.register(request);
        return ApiResponse.success("Đăng ký tài khoản thành công", response);
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ApiResponse.success("Làm mới token thành công", response);
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse response = authService.getProfile(userPrincipal.getId());
        return ApiResponse.success("Lấy thông tin người dùng thành công", response);
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = authService.updateProfile(userPrincipal.getId(), request);
        return ApiResponse.success("Cập nhật thông tin thành công", response);
    }
}
