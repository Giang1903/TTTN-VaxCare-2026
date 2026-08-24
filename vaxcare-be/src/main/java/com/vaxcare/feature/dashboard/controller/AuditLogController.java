package com.vaxcare.feature.dashboard.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.dashboard.dto.AuditLogResponse;
import com.vaxcare.feature.dashboard.service.AuditLogService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "21. Admin - Audit Logs", description = "Nhật ký hệ thống cho Admin")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<List<AuditLogResponse>> list(
            @Parameter(description = "Lọc theo entity_type (USER, INVENTORY, CONFIG, ...)")
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false, defaultValue = "200") Integer limit) {
        return ApiResponse.success("Lấy nhật ký thành công",
                auditLogService.list(entityType, limit != null ? limit : 200));
    }
}