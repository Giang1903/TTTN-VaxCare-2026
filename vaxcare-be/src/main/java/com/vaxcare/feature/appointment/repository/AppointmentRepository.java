package com.vaxcare.feature.appointment.repository;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.feature.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUser_UserIdOrderByAppointmentDateDesc(Long userId);

    List<Appointment> findByFacility_FacilityIdAndAppointmentDate(Long facilityId, LocalDate date);

    List<Appointment> findByFacility_FacilityIdAndAppointmentDateAndStatusIn(
            Long facilityId, LocalDate date, List<AppointmentStatus> statuses);

    Optional<Appointment> findByQrCode(String qrCode);

    @Query("""
        SELECT COUNT(a) FROM Appointment a
        WHERE a.facility.facilityId = :facilityId
          AND a.appointmentDate = :date
          AND a.timeSlot = :timeSlot
          AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        """)
    long countBookingsInSlot(@Param("facilityId") Long facilityId,
                             @Param("date") LocalDate date,
                             @Param("timeSlot") LocalTime timeSlot);

    List<Appointment> findByStatusAndAppointmentDateBefore(AppointmentStatus status, LocalDate date);

    @Query("""
        SELECT a FROM Appointment a
        WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
          AND (:status IS NULL OR a.status = :status)
          AND (:fromDate IS NULL OR a.appointmentDate >= :fromDate)
          AND (:toDate IS NULL OR a.appointmentDate <= :toDate)
        ORDER BY a.appointmentDate ASC, a.timeSlot ASC
        """)
    List<Appointment> searchForStaff(@Param("facilityId") Long facilityId,
                                      @Param("status") AppointmentStatus status,
                                      @Param("fromDate") LocalDate fromDate,
                                      @Param("toDate") LocalDate toDate);
}
