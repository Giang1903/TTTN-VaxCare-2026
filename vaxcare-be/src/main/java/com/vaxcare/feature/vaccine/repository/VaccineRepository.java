package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccineRepository extends JpaRepository<Vaccine, Long> {

    List<Vaccine> findByStatus(ActiveStatus status);

    List<Vaccine> findByCategory_CategoryIdAndStatus(Long categoryId, ActiveStatus status);

    List<Vaccine> findByVaccineNameContainingIgnoreCase(String keyword);
}
