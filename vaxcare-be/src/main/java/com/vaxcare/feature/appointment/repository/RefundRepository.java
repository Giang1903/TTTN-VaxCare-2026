package com.vaxcare.feature.appointment.repository;

import com.vaxcare.feature.appointment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByPayment_PaymentIdOrderByCreatedAtDesc(Long paymentId);

    Optional<Refund> findByRequestId(String requestId);

    List<Refund> findByPayment_Appointment_AppointmentIdOrderByCreatedAtDesc(Long appointmentId);
}
