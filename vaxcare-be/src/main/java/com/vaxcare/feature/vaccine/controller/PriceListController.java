package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.PriceListRequest;
import com.vaxcare.feature.vaccine.dto.PriceListResponse;
import com.vaxcare.feature.vaccine.service.PriceListService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/price-lists")
@RequiredArgsConstructor
@Tag(name = "7. Price List", description = "Bảng giá vắc xin (public GET giá hiện hành, ADMIN quản lý)")
public class PriceListController {

    private final PriceListService priceListService;

    @GetMapping
    public ApiResponse<List<PriceListResponse>> getCurrentPrices(
            @Parameter(description = "ID vắc xin") @RequestParam Long vaccineId,
            @Parameter(description = "ID cơ sở để ưu tiên giá riêng") @RequestParam(required = false) Long facilityId) {
        return ApiResponse.success("Lấy giá vắc xin hiện hành thành công",
                priceListService.getCurrentPrices(vaccineId, facilityId));
    }

    @GetMapping("/vaccine/{vaccineId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
    public ApiResponse<List<PriceListResponse>> getPriceHistory(@PathVariable Long vaccineId) {
        return ApiResponse.success("Lấy lịch sử bảng giá thành công", priceListService.getPriceHistory(vaccineId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PriceListResponse> createPrice(@Valid @RequestBody PriceListRequest request) {
        return ApiResponse.success("Tạo bảng giá vắc xin thành công", priceListService.createPrice(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deactivatePrice(@PathVariable Long id) {
        priceListService.deactivatePrice(id);
        return ApiResponse.success("Vô hiệu hóa bảng giá thành công", null);
    }
}
