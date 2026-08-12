package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.feature.vaccine.entity.VaccineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VaccineCategoryRepository extends JpaRepository<VaccineCategory, Long> {
}
