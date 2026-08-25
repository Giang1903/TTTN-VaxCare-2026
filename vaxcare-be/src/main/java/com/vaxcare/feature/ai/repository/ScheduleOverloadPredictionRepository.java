package com.vaxcare.feature.ai.repository;

import com.vaxcare.feature.ai.entity.ScheduleOverloadPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleOverloadPredictionRepository extends JpaRepository<ScheduleOverloadPrediction, Long> {

    List<ScheduleOverloadPrediction> findByFacility_FacilityIdAndPredictionDate(Long facilityId, LocalDate predictionDate);

    Optional<ScheduleOverloadPrediction> findByFacility_FacilityIdAndPredictionDateAndTimeSlot(
            Long facilityId, LocalDate predictionDate, LocalTime timeSlot);

    @Modifying
    @Query("DELETE FROM ScheduleOverloadPrediction p " +
            "WHERE p.facility.facilityId = :facilityId AND p.predictionDate = :predictionDate")
    void deleteByFacilityAndDate(@Param("facilityId") Long facilityId, @Param("predictionDate") LocalDate predictionDate);
}
