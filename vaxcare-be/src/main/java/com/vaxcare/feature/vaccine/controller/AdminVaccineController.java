package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.VaccineRequest;
import com.vaxcare.feature.vaccine.dto.VaccineResponse;
import com.vaxcare.feature.vaccine.service.VaccineService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/vaccines")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "09. Admin - Vaccine", description = "Quản lý vắc xin (ADMIN)")
public class AdminVaccineController {

    private final VaccineService vaccineService;

    @GetMapping
    public ApiResponse<List<VaccineResponse>> getAllVaccinesForAdmin() {
        return ApiResponse.success("Lấy toàn bộ danh sách vắc xin thành công", vaccineService.getAllVaccinesForAdmin());
    }

    @PostMapping
    public ApiResponse<VaccineResponse> createVaccine(@Valid @RequestBody VaccineRequest request) {
        return ApiResponse.success("Tạo vắc xin thành công", vaccineService.createVaccine(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<VaccineResponse> updateVaccine(
            @PathVariable Long id,
            @Valid @RequestBody VaccineRequest request) {
        return ApiResponse.success("Cập nhật vắc xin thành công", vaccineService.updateVaccine(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivateVaccine(@PathVariable Long id) {
        vaccineService.deactivateVaccine(id);
        return ApiResponse.success("Vô hiệu hóa vắc xin thành công", null);
    }

    @PatchMapping("/{id}/reactivate")
    public ApiResponse<VaccineResponse> reactivateVaccine(@PathVariable Long id) {
        return ApiResponse.success("Kích hoạt lại vắc xin thành công", vaccineService.reactivateVaccine(id));
    }
}
