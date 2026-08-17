package com.vaxcare.feature.vaccine.service;

import com.vaxcare.feature.vaccine.dto.VaccineCategoryResponse;
import com.vaxcare.feature.vaccine.entity.VaccineCategory;
import com.vaxcare.feature.vaccine.repository.VaccineCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VaccineCategoryService {

    private final VaccineCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<VaccineCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private VaccineCategoryResponse mapToResponse(VaccineCategory category) {
        return VaccineCategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .build();
    }
}
