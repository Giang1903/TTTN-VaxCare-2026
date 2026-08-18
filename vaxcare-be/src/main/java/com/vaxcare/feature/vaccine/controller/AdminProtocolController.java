package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.ProtocolRequest;
import com.vaxcare.feature.vaccine.dto.ProtocolResponse;
import com.vaxcare.feature.vaccine.service.VaccinationProtocolService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/protocols")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "11. Admin - Vaccination Protocol", description = "Quản lý phác đồ tiêm chủng (ADMIN)")
public class AdminProtocolController {

    private final VaccinationProtocolService protocolService;

    @PostMapping
    public ApiResponse<ProtocolResponse> createProtocol(@Valid @RequestBody ProtocolRequest request) {
        return ApiResponse.success("Tạo phác đồ tiêm chủng thành công", protocolService.createProtocol(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProtocolResponse> updateProtocol(
            @PathVariable Long id,
            @Valid @RequestBody ProtocolRequest request) {
        return ApiResponse.success("Cập nhật phác đồ tiêm chủng thành công", protocolService.updateProtocol(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProtocol(@PathVariable Long id) {
        protocolService.deleteProtocol(id);
        return ApiResponse.success("Xóa phác đồ tiêm chủng thành công", null);
    }
}
