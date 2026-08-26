package com.vaxcare.feature.appointment.repository;

import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.feature.appointment.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAppointment_AppointmentId(Long appointmentId);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByStatusAndPaymentTimeGreaterThanEqual(PaymentStatus status, LocalDateTime from);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.transactionId = :transactionId")
    Optional<Payment> findByTransactionIdForUpdate(@Param("transactionId") String transactionId);
}
