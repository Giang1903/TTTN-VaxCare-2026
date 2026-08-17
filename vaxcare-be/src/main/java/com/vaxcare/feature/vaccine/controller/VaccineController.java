package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.VaccineResponse;
import com.vaxcare.feature.vaccine.service.VaccineService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vaccines")
@RequiredArgsConstructor
@Tag(name = "6. Vaccine Catalog", description = "Tra cứu vắc xin theo danh mục / đối tượng / độ tuổi (public)")
public class VaccineController {

    private final VaccineService vaccineService;

    @GetMapping
    public ApiResponse<List<VaccineResponse>> searchVaccines(
            @Parameter(description = "ID danh mục / đối tượng vắc xin") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "Từ khóa tên vắc xin") @RequestParam(required = false) String keyword,
            @Parameter(description = "Độ tuổi tra cứu (tính theo tháng)") @RequestParam(required = false) Integer ageMonths,
            @Parameter(description = "Cơ sở tiêm để ưu tiên lấy giá theo cơ sở") @RequestParam(required = false) Long facilityId) {
        List<VaccineResponse> vaccines = vaccineService.searchVaccines(categoryId, keyword, ageMonths, facilityId);
        return ApiResponse.success("Tra cứu vắc xin thành công", vaccines);
    }

    @GetMapping("/{id}")
    public ApiResponse<VaccineResponse> getVaccineById(
            @PathVariable Long id,
            @RequestParam(required = false) Long facilityId) {
        return ApiResponse.success("Lấy chi tiết vắc xin thành công", vaccineService.getVaccineById(id, facilityId));
    }
}
