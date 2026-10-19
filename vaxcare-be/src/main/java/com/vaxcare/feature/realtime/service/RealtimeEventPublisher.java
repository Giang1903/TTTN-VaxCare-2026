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
    public static final String TYPE_NOTIFICATION_CREATED = "NOTIFICATION_CREATED";
    public static final String TYPE_INVENTORY_BATCH_IMPORTED = "INVENTORY_BATCH_IMPORTED";
    public static final String TYPE_INVENTORY_STOCK_UPDATED = "INVENTORY_STOCK_UPDATED";
    public static final String TYPE_INVENTORY_LOW_STOCK = "INVENTORY_LOW_STOCK";
    public static final String TYPE_REACTION_SUBMITTED = "REACTION_SUBMITTED";
    public static final String TYPE_REACTION_PROCESSED = "REACTION_PROCESSED";
    public static final String TYPE_VACCINATION_RECORDED = "VACCINATION_RECORDED";
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
        runAfterCommit(() -> doPublishDomain(event, userEmail, "appointments", "/queue/appointments"));
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
        doPublishDomain(event, userEmail, "appointments", "/queue/appointments");
    }

    public void publishNotification(Object notificationData, Long accountId, String userEmail) {
        if (notificationData == null || userEmail == null || userEmail.isBlank()) {
            return;
        }
        RealtimeEvent<Object> event = RealtimeEvent.builder()
                .type(TYPE_NOTIFICATION_CREATED)
                .data(notificationData)
                .accountId(accountId)
                .build();
        runAfterCommit(() -> {
            try {
                messagingTemplate.convertAndSendToUser(userEmail, "/queue/notifications", event);
                log.debug("Realtime published NOTIFICATION_CREATED to user={}", userEmail);
            } catch (Exception e) {
                log.warn("Realtime notification publish failed: {}", e.getMessage());
            }
        });
    }

    public void publishInventory(String type, Object data, Long facilityId) {
        if (data == null) {
            return;
        }
        RealtimeEvent<Object> event = RealtimeEvent.builder()
                .type(type)
                .data(data)
                .facilityId(facilityId)
                .build();
        runAfterCommit(() -> doPublishDomain(event, null, "inventory", null));
    }

    public void publishReaction(String type, Object data, Long facilityId, Long accountId, String userEmail) {
        if (data == null) {
            return;
        }
        RealtimeEvent<Object> event = RealtimeEvent.builder()
                .type(type)
                .data(data)
                .facilityId(facilityId)
                .accountId(accountId)
                .build();
        runAfterCommit(() -> doPublishDomain(event, userEmail, "reactions", "/queue/reactions"));
    }

    public void publishVaccination(String type, Object data, Long facilityId, Long accountId, String userEmail) {
        if (data == null) {
            return;
        }
        RealtimeEvent<Object> event = RealtimeEvent.builder()
                .type(type)
                .data(data)
                .facilityId(facilityId)
                .accountId(accountId)
                .build();
        runAfterCommit(() -> doPublishDomain(event, userEmail, "vaccinations", "/queue/vaccinations"));
    }

    public void publish(String type, Object data, Long facilityId, Long accountId,
                        String userEmail, String domain, String userQueue) {
        if (data == null) {
            return;
        }
        RealtimeEvent<Object> event = RealtimeEvent.builder()
                .type(type)
                .data(data)
                .facilityId(facilityId)
                .accountId(accountId)
                .build();
        runAfterCommit(() -> doPublishDomain(event, userEmail, domain, userQueue));
    }

    private void doPublishDomain(RealtimeEvent<?> event, String userEmail, String domain, String userQueue) {
        try {
            messagingTemplate.convertAndSend("/topic/" + domain, event);

            if (event.getFacilityId() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/" + domain + "/facility/" + event.getFacilityId(), event);
            }

            if (userEmail != null && !userEmail.isBlank() && userQueue != null) {
                messagingTemplate.convertAndSendToUser(userEmail, userQueue, event);
            }

            log.debug("Realtime published type={} domain={} facilityId={}",
                    event.getType(), domain, event.getFacilityId());
        } catch (Exception e) {
            log.warn("Realtime publish failed type={} domain={}: {}", event.getType(), domain, e.getMessage());
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
