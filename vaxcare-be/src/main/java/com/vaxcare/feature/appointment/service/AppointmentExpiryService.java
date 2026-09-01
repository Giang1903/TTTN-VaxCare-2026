package com.vaxcare.feature.appointment.service;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Tự động hủy:
 * 1) Lịch PENDING chưa thanh toán quá 30 phút → trả chỗ
 * 2) Lịch PENDING/CONFIRMED đã quá khung giờ tiêm mà chưa check-in
 * Không hoàn tiền.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentExpiryService {

    /** Khớp StaffAppointmentService / AppointmentService */
    private static final int SLOT_DURATION_MINUTES = 30;

    /** Thời gian tối đa giữ chỗ khi chưa thanh toán */
    private static final int UNPAID_HOLD_MINUTES = 30;

    private static final String AUTO_CANCEL_REASON_EXPIRED_SLOT =
            "Hệ thống tự hủy: đã quá ngày/giờ tiêm mà chưa check-in";

    private static final String AUTO_CANCEL_REASON_UNPAID_TIMEOUT =
            "Hệ thống tự hủy: quá 30 phút chưa thanh toán – đã trả lại chỗ trống";

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Mỗi 5 phút: hủy lịch PENDING tạo cách đây ≥ 30 phút mà chưa thanh toán thành công.
     * Status → CANCELLED → không còn tính vào capacity (trả chỗ).
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void cancelUnpaidPendingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusMinutes(UNPAID_HOLD_MINUTES);

        List<Appointment> expired = appointmentRepository.findUnpaidPendingCreatedBefore(cutoff);
        int cancelled = 0;

        for (Appointment a : expired) {
            // An toàn: chỉ hủy đúng PENDING
            if (a.getStatus() != AppointmentStatus.PENDING) {
                continue;
            }
            // Nếu đã có payment SUCCESS (edge race với IPN) → bỏ qua
            if (hasSuccessfulPayment(a.getAppointmentId())) {
                continue;
            }

            a.setStatus(AppointmentStatus.CANCELLED);
            a.setCancelledAt(now);
            a.setCancellationReason(AUTO_CANCEL_REASON_UNPAID_TIMEOUT);
            appointmentRepository.save(a);

            markPaymentFailedIfPending(a.getAppointmentId());
            cancelled++;
        }

        if (cancelled > 0) {
            log.info("[CronJob] Hủy {} lịch PENDING quá {} phút chưa thanh toán ",
                    cancelled, UNPAID_HOLD_MINUTES);
        } else {
            log.debug("[CronJob] Không có lịch PENDING hết hạn thanh toán lúc {}", now);
        }
    }

    /**
     * Mỗi 15 phút: hủy PENDING/CONFIRMED đã hết khung giờ hẹn (chưa check-in).
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void cancelExpiredAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime nowTime = now.toLocalTime();

        List<Appointment> pastDays = appointmentRepository.findExpirableBeforeDate(today);
        List<Appointment> pastSlotsToday = appointmentRepository
                .findExpirableOnDateBeforeTime(today, nowTime.minusMinutes(SLOT_DURATION_MINUTES));

        int cancelled = 0;
        cancelled += cancelPastSlot(pastDays, now);
        cancelled += cancelPastSlot(pastSlotsToday, now);

        if (cancelled > 0) {
            log.info("[CronJob] Đã tự hủy {} lịch hẹn quá khung giờ tiêm (không hoàn tiền)", cancelled);
        } else {
            log.debug("[CronJob] Không có lịch hẹn quá hạn khung giờ lúc {}", now);
        }
    }

    private int cancelPastSlot(List<Appointment> list, LocalDateTime now) {
        int n = 0;
        for (Appointment a : list) {
            if (!isPastSlotEnd(a, now)) {
                continue;
            }
            if (a.getStatus() != AppointmentStatus.PENDING
                    && a.getStatus() != AppointmentStatus.CONFIRMED) {
                continue;
            }
            a.setStatus(AppointmentStatus.CANCELLED);
            a.setCancelledAt(now);
            a.setCancellationReason(AUTO_CANCEL_REASON_EXPIRED_SLOT);
            appointmentRepository.save(a);
            if (a.getStatus() == AppointmentStatus.CANCELLED) {
                markPaymentFailedIfPending(a.getAppointmentId());
            }
            n++;
        }
        return n;
    }

    private boolean isPastSlotEnd(Appointment a, LocalDateTime now) {
        if (a.getAppointmentDate() == null || a.getTimeSlot() == null) {
            return false;
        }
        LocalDateTime slotEnd = LocalDateTime.of(a.getAppointmentDate(), a.getTimeSlot())
                .plusMinutes(SLOT_DURATION_MINUTES);
        return !now.isBefore(slotEnd);
    }

    private boolean hasSuccessfulPayment(Long appointmentId) {
        return paymentRepository.findByAppointment_AppointmentId(appointmentId)
                .map(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .orElse(false);
    }

    private void markPaymentFailedIfPending(Long appointmentId) {
        paymentRepository.findByAppointment_AppointmentId(appointmentId).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.PENDING) {
                p.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        });
    }
}