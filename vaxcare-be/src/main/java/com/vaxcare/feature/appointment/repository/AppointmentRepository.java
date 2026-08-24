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


    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.user u
            JOIN FETCH u.account
            JOIN FETCH a.vaccine
            JOIN FETCH a.facility
            LEFT JOIN FETCH a.staff
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND a.appointmentDate BETWEEN :fromDate AND :toDate
            ORDER BY a.appointmentDate ASC, a.timeSlot ASC
            """)
    List<Appointment> findInDateRange(@Param("facilityId") Long facilityId,
                                      @Param("fromDate") LocalDate fromDate,
                                      @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT a.appointmentDate, COUNT(a)
            FROM Appointment a
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND a.appointmentDate BETWEEN :fromDate AND :toDate
            GROUP BY a.appointmentDate
            ORDER BY a.appointmentDate ASC
            """)
    List<Object[]> countGroupByDate(@Param("facilityId") Long facilityId,
                                    @Param("fromDate") LocalDate fromDate,
                                    @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT a.status, COUNT(a)
            FROM Appointment a
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND a.appointmentDate BETWEEN :fromDate AND :toDate
            GROUP BY a.status
            """)
    List<Object[]> countGroupByStatus(@Param("facilityId") Long facilityId,
                                      @Param("fromDate") LocalDate fromDate,
                                      @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT v.vaccineId, v.vaccineName, COUNT(a)
            FROM Appointment a
            JOIN a.vaccine v
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND a.appointmentDate BETWEEN :fromDate AND :toDate
              AND a.status <> com.vaxcare.common.enums.AppointmentStatus.CANCELLED
            GROUP BY v.vaccineId, v.vaccineName
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countGroupByVaccine(@Param("facilityId") Long facilityId,
                                       @Param("fromDate") LocalDate fromDate,
                                       @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT a.timeSlot, COUNT(a)
            FROM Appointment a
            WHERE (:facilityId IS NULL OR a.facility.facilityId = :facilityId)
              AND a.appointmentDate = :date
              AND a.status NOT IN (
                  com.vaxcare.common.enums.AppointmentStatus.CANCELLED,
                  com.vaxcare.common.enums.AppointmentStatus.NO_SHOW
              )
            GROUP BY a.timeSlot
            ORDER BY a.timeSlot ASC
            """)
    List<Object[]> countGroupByTimeSlot(@Param("facilityId") Long facilityId,
                                        @Param("date") LocalDate date);
}