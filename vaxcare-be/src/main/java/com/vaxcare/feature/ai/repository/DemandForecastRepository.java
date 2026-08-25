package com.vaxcare.feature.ai.repository;

import com.vaxcare.feature.ai.entity.DemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, Long> {

    List<DemandForecast> findByVaccine_VaccineIdAndFacility_FacilityIdOrderByForecastPeriodStartAsc(
            Long vaccineId, Long facilityId);

    @Query("DELETE FROM DemandForecast f " +
            "WHERE f.vaccine.vaccineId = :vaccineId AND f.facility.facilityId = :facilityId " +
            "AND f.actualQuantity IS NULL")
    void deleteStaleForecasts(@Param("vaccineId") Long vaccineId, @Param("facilityId") Long facilityId);
}
