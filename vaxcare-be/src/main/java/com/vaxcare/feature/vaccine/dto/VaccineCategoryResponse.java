package com.vaxcare.feature.vaccine.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineCategoryResponse {

    private Long categoryId;
    private String categoryName;
    private String description;
}
