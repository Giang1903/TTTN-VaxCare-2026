package com.vaxcare.feature.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.config.VNPayConfig;
import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.PaymentResponse;
import com.vaxcare.feature.appointment.dto.VNPayUrlResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.common.enums.NotificationType;
import com.vaxcare.feature.notification.service.EmailService;
import com.vaxcare.feature.notification.service.NotificationService;
import com.vaxcare.utils.QRCodeUtil;
import com.vaxcare.utils.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private static final Set<AppointmentStatus> PAYABLE_STATUSES =
            Set.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccountRepository accountRepository;
    private final VNPayConfig vnPayConfig;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    // ===================== TẠO URL THANH TOÁN =====================

    @Transactional
    public VNPayUrlResponse createVnpayPaymentUrl(Long currentAccountId, CreatePaymentRequest request,
                                                    HttpServletRequest httpRequest) {
        Appointment appointment = findAppointmentOrThrow(request.getAppointmentId());
        checkOwnership(appointment, currentAccountId);

        if (!PAYABLE_STATUSES.contains(appointment.getStatus())) {
            throw new BadRequestException(
                    "Không thể thanh toán lịch hẹn đang ở trạng thái " + appointment.getStatus());
        }
        if (appointment.getPrice() == null || appointment.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Lịch hẹn này chưa có giá vắc xin hợp lệ để thanh toán");
        }

        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointment.getAppointmentId())
                .orElse(null);

        if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Lịch hẹn này đã được thanh toán thành công trước đó");
        }

        String txnRef = VNPayUtil.generateTxnRef();

        if (payment == null) {
            payment = Payment.builder()
                    .appointment(appointment)
                    .amount(appointment.getPrice())
                    .status(PaymentStatus.PENDING)
                    .build();
        } else {
            payment.setAmount(appointment.getPrice());
            payment.setStatus(PaymentStatus.PENDING);
        }
        payment.setTransactionId(txnRef);
        payment = paymentRepository.save(payment);

        String paymentUrl = buildPaymentUrl(payment, txnRef, httpRequest);

        return VNPayUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .paymentId(payment.getPaymentId())
                .txnRef(txnRef)
                .build();
    }

    private String buildPaymentUrl(Payment payment, String txnRef, HttpServletRequest httpRequest) {
        LocalDateTime now = LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone()));

        long amount = payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", VNPayConfig.VERSION);
        params.put("vnp_Command", VNPayConfig.COMMAND_PAY);
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", VNPayConfig.CURRENCY_CODE);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan lich hen tiem chung #" + payment.getAppointment().getAppointmentId());
        params.put("vnp_OrderType", VNPayConfig.ORDER_TYPE);
        params.put("vnp_Locale", VNPayConfig.LOCALE);
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", VNPayUtil.getClientIp(httpRequest));
        params.put("vnp_CreateDate", now.format(VNP_DATE_FORMAT));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(VNP_DATE_FORMAT));

        String hashData = VNPayUtil.buildHashData(params);
        String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        return vnPayConfig.getPayUrl() + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    // ===================== XỬ LÝ RETURN (redirect trình duyệt) =====================

    @Transactional
    public String handleReturn(Map<String, String> params) {

        CallbackResult result;
        try {
            result = verifyAndProcess(params);
        } catch (Exception e) {
            log.error("Lỗi xử lý VNPay return callback, params={}", params, e);
            result = new CallbackResult(false, "99", "Có lỗi xảy ra khi xử lý kết quả thanh toán", null);
        }

        String base = vnPayConfig.getFrontendResultUrl();
        StringBuilder redirect = new StringBuilder(base)
                .append(base.contains("?") ? "&" : "?")
                .append("status=").append(result.success ? "success" : "failed")
                .append("&message=").append(java.net.URLEncoder.encode(result.message, java.nio.charset.StandardCharsets.UTF_8));
        if (result.appointmentId != null) {
            redirect.append("&appointmentId=").append(result.appointmentId);
        }
        return redirect.toString();
    }

    // ===================== XỬ LÝ IPN (server-to-server, nguồn xác nhận chính thức) =====================

    @Transactional
    public Map<String, String> handleIpn(Map<String, String> params) {
        Map<String, String> response = new HashMap<>();
        try {
            CallbackResult result = verifyAndProcess(params);
            response.put("RspCode", result.rspCode);
            response.put("Message", result.message);
        } catch (Exception e) {
            log.error("Lỗi xử lý VNPay IPN", e);
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }
        return response;
    }

    // ===================== LOGIC CHUNG CHO RETURN + IPN =====================

    private record CallbackResult(boolean success, String rspCode, String message, Long appointmentId) {
    }

    private CallbackResult verifyAndProcess(Map<String, String> params) {
        Map<String, String> data = new HashMap<>(params);
        String receivedHash = data.remove("vnp_SecureHash");
        data.remove("vnp_SecureHashType");

        if (receivedHash == null) {
            return new CallbackResult(false, "97", "Thiếu chữ ký xác thực", null);
        }

        String hashData = VNPayUtil.buildHashData(data);
        String calculatedHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);
        if (!calculatedHash.equalsIgnoreCase(receivedHash)) {
            log.warn("VNPay callback: chữ ký không hợp lệ, txnRef={}", data.get("vnp_TxnRef"));
            return new CallbackResult(false, "97", "Chữ ký không hợp lệ", null);
        }

        String txnRef = data.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            return new CallbackResult(false, "01", "Không tìm thấy giao dịch", null);
        }

        Payment payment = paymentRepository.findByTransactionIdForUpdate(txnRef).orElse(null);
        if (payment == null) {
            return new CallbackResult(false, "01", "Không tìm thấy giao dịch", null);
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return new CallbackResult(true, "02", "Giao dịch đã được xác nhận trước đó",
                    payment.getAppointment().getAppointmentId());
        }

        long expectedAmount = payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
        String vnpAmount = data.get("vnp_Amount");
        long receivedAmount;
        try {
            receivedAmount = vnpAmount == null ? -1 : Long.parseLong(vnpAmount);
        } catch (NumberFormatException e) {
            // vnp_Amount không parse được thành số -> coi như dữ liệu callback không hợp lệ, không phải lỗi hệ thống.
            return new CallbackResult(false, "04", "Số tiền không hợp lệ", null);
        }
        if (expectedAmount != receivedAmount) {
            return new CallbackResult(false, "04", "Số tiền không hợp lệ", null);
        }

        String responseCode = data.get("vnp_ResponseCode");
        String transactionStatus = data.get("vnp_TransactionStatus");
        boolean isSuccess = "00".equals(responseCode) && "00".equals(transactionStatus);

        try {
            payment.setRawResponse(objectMapper.writeValueAsString(data));
        } catch (Exception e) {
            log.warn("Không thể serialize raw response VNPay", e);
        }

        Appointment appointment = payment.getAppointment();

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentTime(LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone())));
            paymentRepository.save(payment);

            if (!PAYABLE_STATUSES.contains(appointment.getStatus())) {
                log.warn("VNPay báo thanh toán THÀNH CÔNG cho appointment #{} nhưng lịch hẹn đã ở trạng thái {} "
                                + "(không còn payable) -> KHÔNG cấp QR/confirm lại. Cần đối soát và HOÀN TIỀN thủ "
                                + "công cho giao dịch txnRef={}, amount={}",
                        appointment.getAppointmentId(), appointment.getStatus(), txnRef, payment.getAmount());

                return new CallbackResult(true, "00",
                        "Thanh toán thành công nhưng lịch hẹn đã không còn hiệu lực (" + appointment.getStatus()
                                + "). Vui lòng liên hệ tổng đài để được hoàn tiền.",
                        appointment.getAppointmentId());
            }

            if (appointment.getStatus() == AppointmentStatus.PENDING) {
                appointment.setStatus(AppointmentStatus.CONFIRMED);
            }

            if (appointment.getQrCode() == null) {
                appointment.setQrCode(QRCodeUtil.generateToken());
            }
            appointmentRepository.save(appointment);

            sendPaymentSuccessNotifications(payment, appointment);

            return new CallbackResult(true, "00", "Thanh toán thành công", appointment.getAppointmentId());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new CallbackResult(false, "00", "Thanh toán thất bại hoặc bị hủy", appointment.getAppointmentId());
        }
    }

    private void sendPaymentSuccessNotifications(Payment payment, Appointment appointment) {
        final Long appointmentId = appointment.getAppointmentId();
        final Long userId = appointment.getUser() != null ? appointment.getUser().getUserId() : null;
        final String fullName = appointment.getUser() != null ? appointment.getUser().getFullName() : null;
        final String vaccineName = appointment.getVaccine() != null ? appointment.getVaccine().getVaccineName() : null;
        final java.math.BigDecimal amount = payment.getAmount();
        final String txnId = payment.getTransactionId();

        // Notification in-app ngay trong transaction (nhanh, ít lỗi)
        try {
            Account account = null;
            if (userId != null) {
                account = accountRepository.findById(userId).orElse(null);
            }
            if (account == null && appointment.getUser() != null) {
                account = appointment.getUser().getAccount();
            }
            if (account != null) {
                notificationService.create(
                        account,
                        "Thanh toán thành công",
                        "Bạn đã thanh toán thành công " + amount + "đ cho lịch hẹn #"
                                + appointmentId
                                + (vaccineName != null ? " (" + vaccineName + ")" : "") + ".",
                        NotificationType.APPOINTMENT,
                        appointmentId);
            }
        } catch (Exception e) {
            log.error("[Payment] Notification failed appointment #{}: {}", appointmentId, e.getMessage(), e);
        }

        // Email SAU khi commit — tránh mail bị nuốt khi TX/session đóng, và không ảnh hưởng thanh toán
        final Long uid = userId;
        Runnable sendMail = () -> {
            try {
                String toEmail = null;
                String name = fullName;
                if (uid != null) {
                    Account acc = accountRepository.findById(uid).orElse(null);
                    if (acc != null) {
                        toEmail = acc.getEmail();
                        if (name == null && acc.getUser() != null) {
                            name = acc.getUser().getFullName();
                        }
                    }
                }
                if (toEmail == null || toEmail.isBlank()) {
                    log.warn("[Payment] No email for userId={} appointment #{} – skip payment mail",
                            uid, appointmentId);
                    return;
                }
                log.info("[Payment] Sending payment email to {} for appointment #{}", toEmail, appointmentId);
                emailService.sendPaymentConfirmationEmail(
                        toEmail, name, appointmentId, vaccineName, amount, txnId);
            } catch (Exception e) {
                log.error("[Payment] Payment email failed appointment #{}: {}", appointmentId, e.getMessage(), e);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendMail.run();
                }
            });
        } else {
            sendMail.run();
        }
    }

    // ===================== TRA CỨU =====================

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByAppointment(Long appointmentId, Long currentAccountId) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentAccountId);

        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn này chưa có giao dịch thanh toán nào"));

        return mapToResponse(payment);
    }

    // ===================== HELPERS =====================

    private void checkOwnership(Appointment appointment, Long currentAccountId) {
        Account account = accountRepository.findById(currentAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentAccountId));

        boolean isOwner = appointment.getUser().getUserId().equals(currentAccountId);
        boolean isStaffOrAdmin = !account.getRole().name().equals("USER");

        if (!isOwner && !isStaffOrAdmin) {
            throw new UnauthorizedException("Bạn không có quyền thao tác trên lịch hẹn này!");
        }
    }

    private Appointment findAppointmentOrThrow(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn có ID: " + appointmentId));
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointment().getAppointmentId())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .paymentTime(payment.getPaymentTime())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}