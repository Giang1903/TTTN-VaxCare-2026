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

/**
 * Gửi email HTML thương hiệu VaxCare (header, card nội dung, CTA, footer).
 */
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
        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "Cảm ơn bạn đã đăng ký tài khoản <strong>VaxCare</strong>. "
                        + "Vui lòng bấm nút bên dưới để kích hoạt tài khoản "
                        + "<span style=\"color:#64748b;\">(hiệu lực trong 24 giờ)</span>."
                        + "</p>"
                        + ctaButton(link, "Kích hoạt tài khoản")
                        + noteBox("Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.");
        sendHtml(toEmail, "[VaxCare] Xác nhận tài khoản của bạn", "Xác nhận tài khoản", content, "verification");
    }

    public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu tài khoản VaxCare của bạn. "
                        + "Bấm nút bên dưới để tạo mật khẩu mới "
                        + "<span style=\"color:#64748b;\">(hiệu lực trong 1 giờ)</span>."
                        + "</p>"
                        + ctaButton(link, "Đặt lại mật khẩu")
                        + noteBox("Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.");
        sendHtml(toEmail, "[VaxCare] Đặt lại mật khẩu", "Đặt lại mật khẩu", content, "password-reset");
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

        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "VaxCare xác nhận đã <strong style=\"color:#5b8ae0;\">nhận thanh toán thành công</strong>. "
                        + "Lịch hẹn của bạn đã được xác nhận."
                        + "</p>"
                        + infoCard(
                        row("Mã lịch hẹn", "#" + appointmentId)
                                + row("Vắc xin", escape(safe(vaccineName)))
                                + row("Số tiền", "<strong style=\"color:#5b8ae0;\">" + escape(amountStr) + "</strong>")
                                + row("Mã giao dịch VNPay", escape(safe(transactionId)))
                                + row("Trạng thái", "<span style=\"color:#5b8ae0;font-weight:700;\">Thanh toán thành công</span>")
                )
                        + ctaButton(appointmentsLink, "Xem lịch & mã QR")
                        + noteBox("Vui lòng mang theo mã QR khi đến tiêm. Xuất trình tại quầy check-in.");
        sendHtml(toEmail,
                "[VaxCare] Thanh toán thành công – Lịch hẹn #" + appointmentId,
                "Thanh toán thành công",
                content,
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
        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "Chúng tôi xin nhắc: sắp đến lịch tiêm <strong>mũi tiếp theo</strong> trong phác đồ "
                        + "<strong>" + escape(safe(vaccineName)) + "</strong>."
                        + "</p>"
                        + infoCard(
                        row("Vắc xin", escape(safe(vaccineName)))
                                + row("Mũi số", String.valueOf(nextDoseNumber))
                                + row("Ngày dự kiến", escape(dateStr))
                )
                        + ctaButton(bookingLink, "Đặt lịch tiêm ngay")
                        + noteBox("Đặt lịch sớm giúp bạn giữ đúng phác đồ và chọn khung giờ phù hợp.");
        sendHtml(toEmail,
                "[VaxCare] Nhắc lịch tiêm – " + safe(vaccineName) + " mũi " + nextDoseNumber,
                "Nhắc lịch tiêm",
                content,
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
        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "<strong style=\"color:#b91c1c;\">Cảnh báo:</strong> Bạn đã "
                        + "<strong>quá hạn " + daysOverdue + " ngày</strong> so với lịch tiêm mũi tiếp theo "
                        + "vắc xin <strong>" + escape(safe(vaccineName)) + "</strong>."
                        + "</p>"
                        + infoCard(
                        row("Vắc xin", escape(safe(vaccineName)))
                                + row("Mũi số", String.valueOf(nextDoseNumber))
                                + row("Ngày dự kiến", escape(dateStr))
                                + row("Quá hạn", "<strong style=\"color:#b91c1c;\">" + daysOverdue + " ngày</strong>")
                )
                        + ctaButton(bookingLink, "Đặt lịch ngay")
                        + noteBox("Vui lòng liên hệ cơ sở hoặc đặt lịch sớm để hoàn thành phác đồ.");
        sendHtml(toEmail,
                "[VaxCare] Cảnh báo quá hạn tiêm – " + safe(vaccineName) + " mũi " + nextDoseNumber,
                "Cảnh báo quá hạn tiêm",
                content,
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
        String content =
                greeting(fullName)
                        + "<p style=\"margin:0 0 16px;line-height:1.6;color:#334155;\">"
                        + "Cảm ơn bạn đã hoàn thành mũi tiêm tại <strong>VaxCare</strong>. "
                        + "Trong <strong>24–72 giờ</strong> đầu, hãy theo dõi sức khỏe của mình."
                        + "</p>"
                        + infoCard(
                        row("Vắc xin", escape(safe(vaccineName)))
                                + row("Mũi số", String.valueOf(doseNumber))
                                + row("Ngày tiêm", escape(dateStr))
                )
                        + ctaButton(surveyLink, "Khai báo phản ứng sau tiêm")
                        + noteBox("Nếu có triệu chứng nghiêm trọng, hãy đến cơ sở y tế gần nhất ngay.");
        sendHtml(toEmail,
                "[VaxCare] Theo dõi sau tiêm – " + safe(vaccineName),
                "Theo dõi sau tiêm",
                content,
                "post-vax-survey");
    }

    // ===================== HTML TEMPLATE =====================

    private String wrapHtml(String title, String innerContent) {
        return "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<title>" + escape(title) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f1f5f9;padding:24px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;"
                + "box-shadow:0 4px 24px rgba(15,23,42,0.08);\">"
                // Header
                + "<tr><td style=\"background:linear-gradient(135deg,#5b8ae0 0%,#5b9ae0 55%,#5b7ae0 100%);"
                + "padding:28px 28px 24px;text-align:center;\">"
                + "<div style=\"font-size:13px;letter-spacing:2px;font-weight:700;color:rgba(255,255,255,0.85);"
                + "text-transform:uppercase;margin-bottom:8px;\">VAXCARE</div>"
                + "<div style=\"font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;\">"
                + escape(title) + "</div>"
                + "</td></tr>"
                // Body
                + "<tr><td style=\"padding:28px 28px 8px;\">" + innerContent + "</td></tr>"
                // Footer
                + "<tr><td style=\"padding:8px 28px 28px;\">"
                + "<div style=\"border-top:1px solid #e2e8f0;padding-top:18px;text-align:center;"
                + "font-size:12px;color:#94a3b8;line-height:1.6;\">"
                + "Email tự động từ hệ thống VaxCare.<br>"
                + "Vui lòng không trả lời email này."
                + "</div></td></tr>"
                + "</table>"
                + "</td></tr></table></body></html>";
    }

    private String greeting(String fullName) {
        return "<p style=\"margin:0 0 16px;font-size:16px;color:#0f172a;line-height:1.5;\">"
                + "Xin chào <strong>" + escape(safe(fullName)) + "</strong>,"
                + "</p>";
    }

    private String infoCard(String rowsHtml) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:0 0 20px;background:#f8fafc;border:1px solid #e2e8f0;"
                + "border-radius:12px;overflow:hidden;\">"
                + rowsHtml
                + "</table>";
    }

    private String row(String label, String valueHtml) {
        return "<tr>"
                + "<td style=\"padding:12px 16px;font-size:13px;color:#64748b;width:38%;"
                + "border-bottom:1px solid #e2e8f0;vertical-align:top;\">" + escape(label) + "</td>"
                + "<td style=\"padding:12px 16px;font-size:14px;color:#0f172a;font-weight:600;"
                + "border-bottom:1px solid #e2e8f0;vertical-align:top;\">" + valueHtml + "</td>"
                + "</tr>";
    }

    private String ctaButton(String href, String label) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:8px 0 20px;\">"
                + "<tr><td align=\"center\" bgcolor=\"#5b8ae0\" style=\"border-radius:10px;\">"
                + "<a href=\"" + escape(href) + "\" target=\"_blank\" "
                + "style=\"display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;"
                + "color:#ffffff;text-decoration:none;border-radius:10px;background:#5b8ae0;\">"
                + escape(label) + "</a>"
                + "</td></tr></table>";
    }

    private String noteBox(String text) {
        return "<div style=\"margin:0 0 8px;padding:12px 14px;background:#ecfdf5;border:1px solid #7ba0ef;"
                + "border-radius:10px;font-size:13px;color:#3b8ae0;line-height:1.5;\">"
                + escape(text)
                + "</div>";
    }

    // ===================== CORE =====================

    private void sendHtml(String toEmail, String subject, String title, String innerContent, String fallbackHint) {
        send(toEmail, subject, wrapHtml(title, innerContent), true, fallbackHint);
    }

    private void send(String toEmail, String subject, String body, boolean html, String fallbackHint) {
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
            helper.setText(body, html);

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

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}