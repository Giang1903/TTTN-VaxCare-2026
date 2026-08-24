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

    long countByUser_UserId(Long userId);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.user u
        JOIN FETCH u.account
        JOIN FETCH a.facility
        JOIN FETCH a.vaccine
        LEFT JOIN FETCH a.staff
        WHERE u.userId = :userId
          AND a.appointmentDate >= :fromDate
          AND a.status IN :statuses
        ORDER BY a.appointmentDate ASC, a.timeSlot ASC
        """)
    List<Appointment> findUpcomingByUserId(@Param("userId") Long userId,
                                            @Param("fromDate") LocalDate fromDate,
                                            @Param("statuses") List<AppointmentStatus> statuses);

    @Query("""
        SELECT a.status, COUNT(a) FROM Appointment a
        WHERE a.facility.facilityId = :facilityId
          AND a.appointmentDate = :date
        GROUP BY a.status
        """)
    List<Object[]> countByFacilityAndDateGroupByStatus(@Param("facilityId") Long facilityId,
                                                        @Param("date") LocalDate date);

     @Query("""
        SELECT a.status, COUNT(a) FROM Appointment a
        WHERE a.appointmentDate BETWEEN :from AND :to
        GROUP BY a.status
        """)
    List<Object[]> countGroupByStatusInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.user u
        JOIN FETCH u.account
        JOIN FETCH a.facility
        JOIN FETCH a.vaccine
        LEFT JOIN FETCH a.staff
        WHERE u.userId = :userId
        ORDER BY a.appointmentDate DESC, a.timeSlot DESC
        """)
    List<Appointment> findByUserIdWithDetails(@Param("userId") Long userId);

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
            JOIN FETCH a.user u
            JOIN FETCH u.account acc
            JOIN FETCH a.facility
            JOIN FETCH a.vaccine
            LEFT JOIN FETCH a.staff
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND (:date IS NULL OR a.appointmentDate = :date)
              AND (:status IS NULL OR a.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR acc.phone LIKE CONCAT('%', :keyword, '%'))
            ORDER BY a.appointmentDate ASC, a.timeSlot ASC
            """)
    List<Appointment> searchForStaff(@Param("facilityId") Long facilityId,
                                      @Param("date") LocalDate date,
                                      @Param("status") AppointmentStatus status,
                                      @Param("keyword") String keyword);
}
