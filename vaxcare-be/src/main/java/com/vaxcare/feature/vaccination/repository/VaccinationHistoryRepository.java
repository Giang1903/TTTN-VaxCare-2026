package com.vaxcare.feature.vaccination.repository;

import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VaccinationHistoryRepository extends JpaRepository<VaccinationHistory, Long> {

    Optional<VaccinationHistory> findByUser_UserId(Long userId);
}
