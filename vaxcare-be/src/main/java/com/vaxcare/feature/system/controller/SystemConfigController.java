package com.vaxcare.feature.system.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.system.dto.SystemConfigResponse;
import com.vaxcare.feature.system.dto.SystemConfigUpdateRequest;
import com.vaxcare.feature.system.service.SystemConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/configs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "23. Admin - System Config", description = "Cấu hình hệ thống")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    public ApiResponse<List<SystemConfigResponse>> list() {
        return ApiResponse.success("Lấy cấu hình thành công", systemConfigService.listAll());
    }

    @PutMapping
    public ApiResponse<SystemConfigResponse> upsert(@Valid @RequestBody SystemConfigUpdateRequest request) {
        return ApiResponse.success("Cập nhật cấu hình thành công", systemConfigService.upsert(request));
    }

    @PutMapping("/batch")
    public ApiResponse<List<SystemConfigResponse>> upsertBatch(@Valid @RequestBody List<SystemConfigUpdateRequest> requests) {
        return ApiResponse.success("Cập nhật hàng loạt thành công", systemConfigService.upsertBatch(requests));
    }
}