package com.vaxcare.feature.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String body =
                "Xin chào " + (fullName != null ? fullName : "") + ",\n\n"
                        + "Cảm ơn bạn đã đăng ký tài khoản VaxCare.\n"
                        + "Vui lòng bấm vào liên kết sau để kích hoạt tài khoản (hiệu lực trong 24 giờ):\n\n"
                        + link + "\n\n"
                        + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n\n"
                        + "— Đội ngũ VaxCare";

        if (!mailEnabled) {
            log.warn("[MAIL DISABLED] Verification link for {}: {}", toEmail, link);
            return;
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject("[VaxCare] Xác nhận tài khoản của bạn");
            msg.setText(body);
            mailSender.send(msg);
            log.info("Verification email sent to {}", toEmail);
        } catch (Exception e) {
            // Không làm fail luồng đăng ký — log link để dev vẫn kích hoạt được
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            log.warn("[FALLBACK] Verification link for {}: {}", toEmail, link);
        }
    }
}