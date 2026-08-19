package com.vaxcare.feature.vaccine.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccine.dto.VaccineCategoryRequest;
import com.vaxcare.feature.vaccine.dto.VaccineCategoryResponse;
import com.vaxcare.feature.vaccine.service.VaccineCategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/vaccine-categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "08. Admin - Vaccine Category", description = "Quản lý danh mục vắc xin (ADMIN)")
public class AdminVaccineCategoryController {

    private final VaccineCategoryService categoryService;

    @GetMapping("/{id}")
    public ApiResponse<VaccineCategoryResponse> getCategoryById(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết danh mục thành công", categoryService.getCategoryById(id));
    }

    @PostMapping
    public ApiResponse<VaccineCategoryResponse> createCategory(@Valid @RequestBody VaccineCategoryRequest request) {
        return ApiResponse.success("Tạo danh mục vắc xin thành công", categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<VaccineCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody VaccineCategoryRequest request) {
        return ApiResponse.success("Cập nhật danh mục vắc xin thành công", categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success("Xóa danh mục vắc xin thành công", null);
    }
}
