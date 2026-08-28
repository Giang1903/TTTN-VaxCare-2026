package com.vaxcare.feature.auth.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.auth.dto.ForgotPasswordRequest;
import com.vaxcare.feature.auth.dto.ResetPasswordRequest;
import com.vaxcare.feature.auth.dto.*;
import com.vaxcare.feature.auth.service.AuthService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "01. Authentication", description = "Đăng ký, đăng nhập, xác nhận email, làm mới token, thông tin tài khoản")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản USER — gửi email kích hoạt")
    public ApiResponse<AccountResponse> register(@Valid @RequestBody RegisterRequest request) {
        AccountResponse response = authService.register(request);
        return ApiResponse.success(
                "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.",
                response
        );
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    @GetMapping("/verify")
    @Operation(summary = "Kích hoạt tài khoản bằng token trong email")
    public ApiResponse<Void> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ApiResponse.success("Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.", null);
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Gửi lại email xác nhận tài khoản")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.getEmail());
        return ApiResponse.success(
                "Nếu email tồn tại và chưa kích hoạt, hệ thống đã gửi lại link xác nhận.",
                null
        );
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu đặt lại mật khẩu — gửi email chứa token")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ApiResponse.success(
                "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
                null
        );
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt mật khẩu mới bằng token trong email")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.", null);
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

    @Data
    public static class ResendVerificationRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;
    }
}