package com.vaxcare.feature.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@vaxcare.local}")
    private String from;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Cảm ơn bạn đã đăng ký tài khoản VaxCare.\n"
                        + "Vui lòng bấm vào liên kết sau để kích hoạt tài khoản (hiệu lực trong 24 giờ):\n\n"
                        + link + "\n\n"
                        + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n\n"
                        + "— Đội ngũ VaxCare";

        send(toEmail, "[VaxCare] Xác nhận tài khoản của bạn", body, "verification " + link);
    }

    /**
     * Email xác nhận sau khi đặt lịch tiêm thành công.
     */
    public void sendAppointmentConfirmationEmail(
            String toEmail,
            String fullName,
            Long appointmentId,
            String vaccineName,
            String facilityName,
            String facilityAddress,
            LocalDate appointmentDate,
            LocalTime timeSlot,
            BigDecimal price,
            String qrCode
    ) {
        String dateStr = appointmentDate != null ? appointmentDate.format(DATE_FMT) : "—";
        String timeStr = timeSlot != null ? timeSlot.format(TIME_FMT) : "—";
        String priceStr = price != null
                ? String.format("%,.0f", price).replace(',', '.') + "₫"
                : "Liên hệ cơ sở";
        String code = (qrCode != null && !qrCode.isBlank())
                ? qrCode
                : (appointmentId != null ? "VX-" + appointmentId : "—");
        String appointmentsLink = frontendUrl + "/appointments";

        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Bạn đã đặt lịch tiêm chủng thành công trên VaxCare.\n\n"
                        + "===== THÔNG TIN LỊCH HẸN =====\n"
                        + "Mã lịch / QR: " + code + "\n"
                        + "Vắc xin: " + safe(vaccineName) + "\n"
                        + "Cơ sở: " + safe(facilityName) + "\n"
                        + (facilityAddress != null && !facilityAddress.isBlank()
                                ? "Địa chỉ: " + facilityAddress + "\n" : "")
                        + "Ngày: " + dateStr + "\n"
                        + "Giờ: " + timeStr + "\n"
                        + "Tạm tính: " + priceStr + "\n"
                        + "Trạng thái: Chờ xác nhận\n\n"
                        + "Vui lòng mang theo mã QR / mã lịch khi đến tiêm.\n"
                        + "Xem hoặc hủy lịch tại: " + appointmentsLink + "\n\n"
                        + "— Đội ngũ VaxCare";

        send(toEmail, "[VaxCare] Xác nhận đặt lịch tiêm – " + code, body, "appointment " + code);
    }

    private void send(String toEmail, String subject, String body, String fallbackHint) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Skip email: empty recipient ({})", fallbackHint);
            return;
        }
        if (!mailEnabled) {
            log.warn("[MAIL DISABLED] To={} | {} | body preview:\n{}", toEmail, fallbackHint, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to {} ({})", toEmail, fallbackHint);
        } catch (Exception e) {
            log.error("Failed to send email to {} ({}): {}", toEmail, fallbackHint, e.getMessage());
            log.warn("[FALLBACK] {}", fallbackHint);
        }
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }
}