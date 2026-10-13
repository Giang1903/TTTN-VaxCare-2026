package com.vaxcare.feature.realtime.service;

import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.realtime.dto.RealtimeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeEventPublisher {

    public static final String TYPE_APPOINTMENT_CREATED = "APPOINTMENT_CREATED";
    public static final String TYPE_APPOINTMENT_UPDATED = "APPOINTMENT_UPDATED";
    public static final String TYPE_APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED";
    public static final String TYPE_APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED";
    public static final String TYPE_APPOINTMENT_CHECKED_IN = "APPOINTMENT_CHECKED_IN";
    public static final String TYPE_APPOINTMENT_COMPLETED = "APPOINTMENT_COMPLETED";
    public static final String TYPE_APPOINTMENT_RESCHEDULED = "APPOINTMENT_RESCHEDULED";
    public static final String TYPE_PAYMENT_SUCCESS = "PAYMENT_SUCCESS";
    public static final String TYPE_PAYMENT_FAILED = "PAYMENT_FAILED";
    public static final String TYPE_PAYMENT_REFUNDED = "PAYMENT_REFUNDED";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishAppointment(String type, AppointmentResponse appointment, String userEmail) {
        if (appointment == null) {
            return;
        }
        RealtimeEvent<AppointmentResponse> event = RealtimeEvent.<AppointmentResponse>builder()
                .type(type)
                .data(appointment)
                .facilityId(appointment.getFacilityId())
                .accountId(appointment.getUserId())
                .build();

        runAfterCommit(() -> doPublishAppointment(event, userEmail));
    }

    public void publishAppointmentNow(String type, AppointmentResponse appointment, String userEmail) {
        if (appointment == null) {
            return;
        }
        RealtimeEvent<AppointmentResponse> event = RealtimeEvent.<AppointmentResponse>builder()
                .type(type)
                .data(appointment)
                .facilityId(appointment.getFacilityId())
                .accountId(appointment.getUserId())
                .build();
        doPublishAppointment(event, userEmail);
    }

    private void doPublishAppointment(RealtimeEvent<AppointmentResponse> event, String userEmail) {
        try {
            messagingTemplate.convertAndSend("/topic/appointments", event);

            if (event.getFacilityId() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/appointments/facility/" + event.getFacilityId(), event);
            }

            if (userEmail != null && !userEmail.isBlank()) {
                messagingTemplate.convertAndSendToUser(userEmail, "/queue/appointments", event);
            }

            log.debug("Realtime published type={} appointmentId={} facilityId={}",
                    event.getType(),
                    event.getData() != null ? event.getData().getAppointmentId() : null,
                    event.getFacilityId());
        } catch (Exception e) {
            log.warn("Realtime publish failed type={}: {}", event.getType(), e.getMessage());
        }
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
