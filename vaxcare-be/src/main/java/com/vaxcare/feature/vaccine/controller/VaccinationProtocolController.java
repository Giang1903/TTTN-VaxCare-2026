package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.ProtocolResponse;
import com.vaxcare.feature.vaccine.service.VaccinationProtocolService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/protocols")
@RequiredArgsConstructor
@Tag(name = "10. Vaccination Protocol", description = "Xem phác đồ tiêm chủng theo vắc xin (public)")
public class VaccinationProtocolController {

    private final VaccinationProtocolService protocolService;

    @GetMapping("/vaccine/{vaccineId}")
    public ApiResponse<List<ProtocolResponse>> getProtocolsByVaccine(@PathVariable Long vaccineId) {
        return ApiResponse.success("Lấy phác đồ tiêm chủng thành công", protocolService.getProtocolsByVaccine(vaccineId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProtocolResponse> getProtocolById(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết phác đồ tiêm chủng thành công", protocolService.getProtocolById(id));
    }
}
