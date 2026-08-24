package com.vaxcare.feature.vaccine.service;

import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.vaccine.dto.VaccineCategoryRequest;
import com.vaxcare.feature.vaccine.dto.VaccineCategoryResponse;
import com.vaxcare.feature.vaccine.entity.VaccineCategory;
import com.vaxcare.feature.vaccine.repository.VaccineCategoryRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VaccineCategoryService {

    private final VaccineCategoryRepository categoryRepository;
    private final VaccineRepository vaccineRepository;

    @Transactional(readOnly = true)
    public List<VaccineCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VaccineCategoryResponse getCategoryById(Long categoryId) {
        return mapToResponse(findCategoryOrThrow(categoryId));
    }

    @Transactional
    public VaccineCategoryResponse createCategory(VaccineCategoryRequest request) {
        String categoryName = normalizeName(request.getCategoryName());
        if (categoryName.isEmpty()) {
            throw new BadRequestException("Tên danh mục không được để trống");
        }
        if (categoryRepository.existsByCategoryNameIgnoreCase(categoryName)) {
            throw new BadRequestException("Đã tồn tại danh mục với tên: " + categoryName);
        }

        VaccineCategory category = VaccineCategory.builder()
                .categoryName(categoryName)
                .description(request.getDescription())
                .build();

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public VaccineCategoryResponse updateCategory(Long categoryId, VaccineCategoryRequest request) {
        VaccineCategory category = findCategoryOrThrow(categoryId);

        if (request.getCategoryName() != null) {
            String categoryName = normalizeName(request.getCategoryName());
            if (categoryName.isEmpty()) {
                throw new BadRequestException("Tên danh mục không được để trống");
            }
            if (categoryRepository.existsByCategoryNameIgnoreCaseAndCategoryIdNot(categoryName, categoryId)) {
                throw new BadRequestException("Đã tồn tại danh mục với tên: " + categoryName);
            }
            category.setCategoryName(categoryName);
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        VaccineCategory category = findCategoryOrThrow(categoryId);

        if (vaccineRepository.existsByCategory_CategoryId(categoryId)) {
            throw new BadRequestException(
                    "Không thể xóa danh mục đang có vắc xin sử dụng. Hãy chuyển các vắc xin sang danh mục khác trước.");
        }

        categoryRepository.delete(category);
    }

    private VaccineCategory findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục vắc xin có ID: " + categoryId));
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private VaccineCategoryResponse mapToResponse(VaccineCategory category) {
        return VaccineCategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .build();
    }
}

