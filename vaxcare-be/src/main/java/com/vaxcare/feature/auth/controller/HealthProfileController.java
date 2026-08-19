package com.vaxcare.feature.auth.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.auth.dto.HealthProfileRequest;
import com.vaxcare.feature.auth.dto.HealthProfileResponse;
import com.vaxcare.feature.auth.service.HealthProfileService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/health-profiles")
@RequiredArgsConstructor
@Tag(name = "03. Health Profile", description = "CRUD hồ sơ sức khỏe (người thân/trẻ em) của User")
public class HealthProfileController {

    private final HealthProfileService healthProfileService;

    @GetMapping
    public ApiResponse<HealthProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        HealthProfileResponse response = healthProfileService.getProfileByUserId(userPrincipal.getId());
        return ApiResponse.success("Lấy hồ sơ sức khỏe thành công", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<HealthProfileResponse> getProfileById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        HealthProfileResponse response = healthProfileService.getProfileById(id, userPrincipal.getId());
        return ApiResponse.success("Lấy hồ sơ sức khỏe chi tiết thành công", response);
    }

    @PostMapping
    public ApiResponse<HealthProfileResponse> createProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody HealthProfileRequest request) {
        HealthProfileResponse response = healthProfileService.createProfile(userPrincipal.getId(), request);
        return ApiResponse.success("Tạo hồ sơ sức khỏe thành công", response);
    }

    @PutMapping("/{id}")
    public ApiResponse<HealthProfileResponse> updateProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody HealthProfileRequest request) {
        HealthProfileResponse response = healthProfileService.updateProfile(id, userPrincipal.getId(), request);
        return ApiResponse.success("Cập nhật hồ sơ sức khỏe thành công", response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        healthProfileService.deleteProfile(id, userPrincipal.getId());
        return ApiResponse.success("Xóa hồ sơ sức khỏe thành công", null);
    }
}
