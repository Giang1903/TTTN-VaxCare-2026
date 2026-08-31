package com.vaxcare.feature.inventory.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.BatchStatus;
import com.vaxcare.feature.inventory.dto.AlertThresholdRequest;
import com.vaxcare.feature.inventory.dto.StockSummaryResponse;
import com.vaxcare.feature.inventory.dto.VaccineBatchRequest;
import com.vaxcare.feature.inventory.dto.VaccineBatchResponse;
import com.vaxcare.feature.inventory.service.InventoryService;
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
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
@Tag(name = "16. Inventory", description = "Quản lý kho vắc xin: nhập lô, xem tồn kho, cảnh báo (STAFF chỉ cơ sở mình; ADMIN mọi cơ sở)")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/batches")
    public ApiResponse<VaccineBatchResponse> importBatch(
            @Valid @RequestBody VaccineBatchRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Nhập lô vắc xin thành công",
                inventoryService.importBatch(request, userPrincipal.getId()));
    }

    @GetMapping("/batches")
    public ApiResponse<List<VaccineBatchResponse>> getBatches(
            @RequestParam Long facilityId,
            @RequestParam(required = false) Long vaccineId,
            @RequestParam(required = false) BatchStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách lô vắc xin thành công",
                inventoryService.getBatches(facilityId, vaccineId, status, userPrincipal.getId()));
    }

    @GetMapping("/batches/{id}")
    public ApiResponse<VaccineBatchResponse> getBatchById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy chi tiết lô vắc xin thành công",
                inventoryService.getBatchById(id, userPrincipal.getId()));
    }

    @GetMapping("/stock")
    public ApiResponse<List<StockSummaryResponse>> getStockSummary(
            @RequestParam Long facilityId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy tồn kho theo cơ sở thành công",
                inventoryService.getStockSummary(facilityId, userPrincipal.getId()));
    }

    @GetMapping("/alerts/low-stock")
    public ApiResponse<List<StockSummaryResponse>> getLowStockAlerts(
            @RequestParam Long facilityId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách cảnh báo tồn kho thấp thành công",
                inventoryService.getLowStockAlerts(facilityId, userPrincipal.getId()));
    }

    @GetMapping("/alerts/expiring-soon")
    public ApiResponse<List<VaccineBatchResponse>> getExpiringSoon(
            @RequestParam Long facilityId,
            @Parameter(description = "Số ngày tính từ hôm nay, mặc định 30 ngày")
            @RequestParam(required = false, defaultValue = "30") int withinDays,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách lô vắc xin sắp hết hạn thành công",
                inventoryService.getExpiringSoon(facilityId, withinDays, userPrincipal.getId()));
    }

    @PutMapping("/{facilityId}/alert-threshold")
    public ApiResponse<Void> updateAlertThreshold(
            @PathVariable Long facilityId,
            @Valid @RequestBody AlertThresholdRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        inventoryService.updateAlertThreshold(facilityId, request, userPrincipal.getId());
        return ApiResponse.success("Cập nhật ngưỡng cảnh báo tồn kho thành công", null);
    }
}