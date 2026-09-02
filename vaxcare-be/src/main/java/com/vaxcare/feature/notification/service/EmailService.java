package com.vaxcare.feature.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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

    // ===================== AUTH =====================

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Cảm ơn bạn đã đăng ký tài khoản VaxCare.\n"
                        + "Vui lòng bấm vào liên kết sau để kích hoạt tài khoản (hiệu lực trong 24 giờ):\n\n"
                        + link + "\n\n"
                        + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail, "[VaxCare] Xác nhận tài khoản của bạn", body, "verification");
    }

    public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu tài khoản VaxCare của bạn.\n"
                        + "Bấm vào liên kết sau để tạo mật khẩu mới (hiệu lực trong 1 giờ):\n\n"
                        + link + "\n\n"
                        + "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail, "[VaxCare] Đặt lại mật khẩu", body, "password-reset");
    }

    // ===================== APPOINTMENT / PAYMENT =====================

    public void sendPaymentConfirmationEmail(
            String toEmail,
            String fullName,
            Long appointmentId,
            String vaccineName,
            BigDecimal amount,
            String transactionId
    ) {
        String amountStr = amount != null
                ? String.format("%,.0f", amount).replace(',', '.') + "₫"
                : "—";
        String appointmentsLink = frontendUrl + "/appointments";

        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "VaxCare xác nhận đã nhận được thanh toán của bạn.\n\n"
                        + "===== THÔNG TIN THANH TOÁN =====\n"
                        + "Mã lịch hẹn: #" + appointmentId + "\n"
                        + "Vắc xin: " + safe(vaccineName) + "\n"
                        + "Số tiền: " + amountStr + "\n"
                        + "Mã giao dịch VNPay: " + safe(transactionId) + "\n"
                        + "Trạng thái: Thanh toán thành công\n\n"
                        + "Lịch hẹn của bạn đã được xác nhận. Vui lòng mang theo mã QR khi đến tiêm.\n"
                        + "Xem lịch / mã QR tại: " + appointmentsLink + "\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail,
                "[VaxCare] Thanh toán thành công – Lịch hẹn #" + appointmentId,
                body,
                "payment#" + appointmentId);
    }

    // ===================== REMINDER =====================

    public void sendNextDoseReminderEmail(
            String toEmail,
            String fullName,
            String vaccineName,
            int nextDoseNumber,
            LocalDate nextDoseDate
    ) {
        String dateStr = nextDoseDate != null ? nextDoseDate.format(DATE_FMT) : "—";
        String bookingLink = frontendUrl + "/booking";
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Đã đến lúc bạn tiêm mũi tiếp theo trong phác đồ vắc xin " + safe(vaccineName) + ".\n\n"
                        + "===== THÔNG TIN NHẮC LỊCH =====\n"
                        + "Vắc xin: " + safe(vaccineName) + "\n"
                        + "Mũi số: " + nextDoseNumber + "\n"
                        + "Ngày dự kiến: " + dateStr + "\n\n"
                        + "Vui lòng đặt lịch sớm:\n" + bookingLink + "\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail,
                "[VaxCare] Nhắc lịch tiêm – " + safe(vaccineName) + " mũi " + nextDoseNumber,
                body,
                "reminder-dose" + nextDoseNumber);
    }

    public void sendOverdueDoseReminderEmail(
            String toEmail,
            String fullName,
            String vaccineName,
            int nextDoseNumber,
            LocalDate nextDoseDate,
            long daysOverdue
    ) {
        String dateStr = nextDoseDate != null ? nextDoseDate.format(DATE_FMT) : "—";
        String bookingLink = frontendUrl + "/booking";
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "CẢNH BÁO: Bạn đã QUÁ HẠN tiêm mũi tiếp theo vắc xin " + safe(vaccineName) + ".\n\n"
                        + "===== THÔNG TIN =====\n"
                        + "Vắc xin: " + safe(vaccineName) + "\n"
                        + "Mũi số: " + nextDoseNumber + "\n"
                        + "Ngày dự kiến: " + dateStr + "\n"
                        + "Số ngày quá hạn: " + daysOverdue + " ngày\n\n"
                        + "Vui lòng đặt lịch sớm:\n" + bookingLink + "\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail,
                "[VaxCare] Cảnh báo quá hạn tiêm – " + safe(vaccineName) + " mũi " + nextDoseNumber,
                body,
                "overdue-dose" + nextDoseNumber);
    }

    public void sendPostVaccinationSurveyEmail(
            String toEmail,
            String fullName,
            String vaccineName,
            int doseNumber,
            LocalDate injectionDate
    ) {
        String dateStr = injectionDate != null ? injectionDate.format(DATE_FMT) : "—";
        String surveyLink = frontendUrl + "/records";
        String body =
                "Xin chào " + safe(fullName) + ",\n\n"
                        + "Cảm ơn bạn đã hoàn thành mũi tiêm tại VaxCare.\n\n"
                        + "===== THEO DÕI SAU TIÊM (24–72 GIỜ) =====\n"
                        + "Vắc xin: " + safe(vaccineName) + "\n"
                        + "Mũi số: " + doseNumber + "\n"
                        + "Ngày tiêm: " + dateStr + "\n\n"
                        + "Trong 24–72 giờ đầu, hãy theo dõi sức khỏe. Nếu có triệu chứng, vào VaxCare "
                        + "khai báo phản ứng sau tiêm:\n" + surveyLink + "\n\n"
                        + "Nếu nghiêm trọng, hãy đến cơ sở y tế gần nhất.\n\n"
                        + "— Đội ngũ VaxCare";
        send(toEmail,
                "[VaxCare] Theo dõi sau tiêm – " + safe(vaccineName),
                body,
                "post-vax-survey");
    }

    // ===================== CORE: MimeMessage UTF-8 =====================

    /**
     * Gửi email qua SMTP (Gmail). Dùng MimeMessage + UTF-8 để tránh lỗi encoding
     * và tương thích tốt hơn SimpleMailMessage.
     */
    private void send(String toEmail, String subject, String body, String fallbackHint) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("[MAIL] Skip: empty recipient ({})", fallbackHint);
            return;
        }
        if (!mailEnabled) {
            log.warn("[MAIL] DISABLED – would send to={} subject={} ({})", toEmail, subject, fallbackHint);
            return;
        }
        if (from == null || from.isBlank()) {
            log.error("[MAIL] spring.mail.username (from) is empty – cannot send ({})", fallbackHint);
            return;
        }

        String recipient = toEmail.trim();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
            log.info("[MAIL] SENT OK to={} from={} subject={} ({})", recipient, from, subject, fallbackHint);
        } catch (Exception e) {
            log.error("[MAIL] FAILED to={} from={} subject={} ({}): {}",
                    recipient, from, subject, fallbackHint, e.getMessage(), e);
        }
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }
}