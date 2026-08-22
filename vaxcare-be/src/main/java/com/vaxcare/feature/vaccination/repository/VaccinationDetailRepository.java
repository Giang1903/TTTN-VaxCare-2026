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
}
