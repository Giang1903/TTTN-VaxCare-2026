package com.vaxcare.feature.vaccination.repository;

import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VaccinationHistoryRepository extends JpaRepository<VaccinationHistory, Long> {

    Optional<VaccinationHistory> findByUser_UserId(Long userId);

    @Query("""
        SELECT h FROM VaccinationHistory h
        LEFT JOIN FETCH h.details d
        LEFT JOIN FETCH d.vaccine
        WHERE h.user.userId = :userId
        """)
    Optional<VaccinationHistory> findByUserIdWithDetails(@Param("userId") Long userId);
}
