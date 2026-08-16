package com.vaxcare.feature.facility.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.facility.dto.FacilityRequest;
import com.vaxcare.feature.facility.dto.FacilityResponse;
import com.vaxcare.feature.facility.service.VaccinationFacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/facilities")
@RequiredArgsConstructor
public class VaccinationFacilityController {

    private final VaccinationFacilityService facilityService;

    @GetMapping
    public ApiResponse<List<FacilityResponse>> getAllFacilities() {
        return ApiResponse.success("Lấy danh sách cơ sở tiêm chủng thành công", facilityService.getActiveFacilities());
    }

    // Dành cho Admin: xem toàn bộ cơ sở, kể cả đã vô hiệu hóa (INACTIVE)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<FacilityResponse>> getAllFacilitiesForAdmin() {
        return ApiResponse.success("Lấy toàn bộ danh sách cơ sở tiêm chủng thành công", facilityService.getAllFacilities());
    }

    @GetMapping("/{id}")
    public ApiResponse<FacilityResponse> getFacilityById(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết cơ sở tiêm chủng thành công", facilityService.getFacilityById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
    public ApiResponse<FacilityResponse> createFacility(@Valid @RequestBody FacilityRequest request) {
        FacilityResponse response = facilityService.createFacility(request);
        return ApiResponse.success("Tạo cơ sở tiêm chủng thành công", response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
    public ApiResponse<FacilityResponse> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody FacilityRequest request) {
        FacilityResponse response = facilityService.updateFacility(id, request);
        return ApiResponse.success("Cập nhật cơ sở tiêm chủng thành công", response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICAL_STAFF')")
    public ApiResponse<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ApiResponse.success("Vô hiệu hóa cơ sở tiêm chủng thành công", null);
    }

    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FacilityResponse> reactivateFacility(@PathVariable Long id) {
        FacilityResponse response = facilityService.reactivateFacility(id);
        return ApiResponse.success("Kích hoạt lại cơ sở tiêm chủng thành công", response);
    }
}
