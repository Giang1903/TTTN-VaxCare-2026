package com.vaxcare.feature.vaccination.repository;

import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinationDetailRepository extends JpaRepository<VaccinationDetail, Long> {

    boolean existsByAppointment_AppointmentId(Long appointmentId);

    long countByHistory_HistoryIdAndVaccine_VaccineIdAndResultNot(
            Long historyId, Long vaccineId, VaccinationResult excludedResult);

    long countByHistory_User_UserIdAndResult(Long userId, VaccinationResult result);

    long countByResultAndInjectionDateBetween(VaccinationResult result, java.time.LocalDate from, java.time.LocalDate to);

    @Query("""
        SELECT d.result, COUNT(d) FROM VaccinationDetail d
        WHERE d.appointment.facility.facilityId = :facilityId
          AND d.injectionDate = :date
        GROUP BY d.result
        """)
    List<Object[]> countByFacilityAndDateGroupByResult(@Param("facilityId") Long facilityId,
                                                        @Param("date") java.time.LocalDate date);

    @Query("""
        SELECT d FROM VaccinationDetail d
        JOIN FETCH d.vaccine
        LEFT JOIN FETCH d.batch
        LEFT JOIN FETCH d.staff
        LEFT JOIN FETCH d.appointment a
        LEFT JOIN FETCH a.facility
        WHERE d.history.historyId = :historyId
        ORDER BY d.injectionDate DESC, d.createdAt DESC
        """)
    List<VaccinationDetail> findAllByHistoryIdWithDetails(@Param("historyId") Long historyId);
    @Query("""
        SELECT d FROM VaccinationDetail d
        JOIN FETCH d.vaccine v
        JOIN FETCH d.history h
        JOIN FETCH h.user u
        JOIN FETCH u.account
        WHERE d.result = com.vaxcare.common.enums.VaccinationResult.SUCCESS
          AND d.detailId = (
              SELECT MAX(d2.detailId) FROM VaccinationDetail d2
              WHERE d2.history = d.history
                AND d2.vaccine = v
                AND d2.result = com.vaxcare.common.enums.VaccinationResult.SUCCESS
          )
        """)
    List<VaccinationDetail> findLatestSuccessDetailPerUserAndVaccine();

    @Query("""
        SELECT d.injectionDate, COUNT(d)
        FROM VaccinationDetail d
        WHERE d.vaccine.vaccineId = :vaccineId
          AND d.appointment.facility.facilityId = :facilityId
          AND d.result = com.vaxcare.common.enums.VaccinationResult.SUCCESS
          AND d.injectionDate BETWEEN :fromDate AND :toDate
        GROUP BY d.injectionDate
        ORDER BY d.injectionDate ASC
        """)
    List<Object[]> findDailyConsumption(@Param("vaccineId") Long vaccineId,
                                         @Param("facilityId") Long facilityId,
                                         @Param("fromDate") java.time.LocalDate fromDate,
                                         @Param("toDate") java.time.LocalDate toDate);

    @Query("""
        SELECT DISTINCT d.vaccine.vaccineId, d.appointment.facility.facilityId
        FROM VaccinationDetail d
        WHERE d.result = com.vaxcare.common.enums.VaccinationResult.SUCCESS
          AND d.appointment IS NOT NULL
        """)
    List<Object[]> findDistinctVaccineFacilityCombos();


    @Query("""
        SELECT d FROM VaccinationDetail d
        JOIN FETCH d.vaccine
        JOIN FETCH d.history h
        JOIN FETCH h.user u
        JOIN FETCH u.account
        WHERE d.result IN (
              com.vaxcare.common.enums.VaccinationResult.SUCCESS,
              com.vaxcare.common.enums.VaccinationResult.PARTIAL
          )
          AND d.injectionDate BETWEEN :fromDate AND :toDate
        """)
    List<VaccinationDetail> findSuccessfulInjectionsBetween(
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate") java.time.LocalDate toDate);

}