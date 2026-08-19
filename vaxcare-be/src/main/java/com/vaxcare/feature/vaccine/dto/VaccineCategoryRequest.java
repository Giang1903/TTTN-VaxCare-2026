package com.vaxcare.feature.vaccine.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineCategoryRequest {

    @Size(max = 150, message = "Tên danh mục không được vượt quá 150 ký tự")
    private String categoryName;

    private String description;
}
