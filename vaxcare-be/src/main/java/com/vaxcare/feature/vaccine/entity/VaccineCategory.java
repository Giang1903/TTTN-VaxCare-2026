package com.vaxcare.feature.vaccine.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vaccine_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", nullable = false, length = 150)
    private String categoryName;

    @Column(columnDefinition = "TEXT")
    private String description;
}
