package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.VaccineCategoryResponse;
import com.vaxcare.feature.vaccine.service.VaccineCategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vaccine-categories")
@RequiredArgsConstructor
@Tag(name = "5. Vaccine Category", description = "Danh mục vắc xin (public GET)")
public class VaccineCategoryController {

    private final VaccineCategoryService categoryService;

    @GetMapping
    public ApiResponse<List<VaccineCategoryResponse>> getAllCategories() {
        return ApiResponse.success("Lấy danh mục vắc xin thành công", categoryService.getAllCategories());
    }
}
