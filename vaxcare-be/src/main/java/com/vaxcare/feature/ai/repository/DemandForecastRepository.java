package com.vaxcare.feature.ai.repository;

import com.vaxcare.feature.ai.entity.DemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, Long> {

    @Query("""
            SELECT f FROM DemandForecast f
            JOIN FETCH f.vaccine
            JOIN FETCH f.facility
            WHERE f.vaccine.vaccineId = :vaccineId
              AND f.facility.facilityId = :facilityId
            ORDER BY f.forecastPeriodStart ASC
            """)
    List<DemandForecast> findByVaccineAndFacilityWithDetails(
            @Param("vaccineId") Long vaccineId,
            @Param("facilityId") Long facilityId);

    List<DemandForecast> findByVaccine_VaccineIdAndFacility_FacilityIdOrderByForecastPeriodStartAsc(
            Long vaccineId, Long facilityId);

    @Query("""
            SELECT f.vaccine.vaccineId, COALESCE(SUM(f.predictedQuantity), 0)
            FROM DemandForecast f
            WHERE f.forecastPeriodStart >= :fromDate
              AND f.forecastPeriodStart <= :toDate
            GROUP BY f.vaccine.vaccineId
            """)
    List<Object[]> sumPredictedQuantityByVaccineBetween(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT f.vaccine.vaccineId, COALESCE(SUM(f.predictedQuantity), 0)
            FROM DemandForecast f
            WHERE f.facility.facilityId = :facilityId
              AND f.forecastPeriodStart >= :fromDate
              AND f.forecastPeriodStart <= :toDate
            GROUP BY f.vaccine.vaccineId
            """)
    List<Object[]> sumPredictedQuantityByVaccineAtFacilityBetween(
            @Param("facilityId") Long facilityId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Modifying
    @Query("DELETE FROM DemandForecast f " +
            "WHERE f.vaccine.vaccineId = :vaccineId AND f.facility.facilityId = :facilityId " +
            "AND f.actualQuantity IS NULL")
    void deleteStaleForecasts(@Param("vaccineId") Long vaccineId, @Param("facilityId") Long facilityId);
}