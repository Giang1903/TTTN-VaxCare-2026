package com.vaxcare.feature.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.NotificationType;
import com.vaxcare.common.enums.PaymentMethod;
import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.common.enums.RefundStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.config.VNPayConfig;
import com.vaxcare.config.ZaloPayConfig;
import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.CreateRefundRequest;
import com.vaxcare.feature.appointment.dto.PaymentResponse;
import com.vaxcare.feature.appointment.dto.RefundResponse;
import com.vaxcare.feature.appointment.dto.VNPayUrlResponse;
import com.vaxcare.feature.appointment.dto.ZaloPayUrlResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.entity.Refund;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import com.vaxcare.feature.appointment.repository.RefundRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.inventory.repository.VaccineBatchRepository;
import com.vaxcare.feature.notification.service.EmailService;
import com.vaxcare.feature.notification.service.NotificationService;
import com.vaxcare.utils.QRCodeUtil;
import com.vaxcare.utils.VNPayUtil;
import com.vaxcare.utils.ZaloPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
@Slf4j
public class PaymentService {

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private static final Set<AppointmentStatus> PAYABLE_STATUSES =
            Set.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccountRepository accountRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final VNPayConfig vnPayConfig;
    private final ZaloPayConfig zaloPayConfig;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final RestClient.Builder restClientBuilder;

    @Transactional
    public VNPayUrlResponse createVnpayPaymentUrl(Long currentAccountId, CreatePaymentRequest request,
                                                    HttpServletRequest httpRequest) {
        Appointment appointment = findAppointmentOrThrow(request.getAppointmentId());
        checkOwnership(appointment, currentAccountId);
        validatePayable(appointment);

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
                    .paymentMethod(PaymentMethod.VNPAY)
                    .build();
        } else {
            payment.setAmount(appointment.getPrice());
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentMethod(PaymentMethod.VNPAY);
            payment.setGatewayTransactionId(null);
            payment.setRefundedAmount(BigDecimal.ZERO);
        }
        payment.setTransactionId(txnRef);
        payment = paymentRepository.save(payment);

        String paymentUrl = buildVnpayPaymentUrl(payment, txnRef, httpRequest);

        return VNPayUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .paymentId(payment.getPaymentId())
                .txnRef(txnRef)
                .build();
    }

    @Transactional
    public ZaloPayUrlResponse createZalopayPaymentUrl(Long currentAccountId, CreatePaymentRequest request) {
        Appointment appointment = findAppointmentOrThrow(request.getAppointmentId());
        checkOwnership(appointment, currentAccountId);
        validatePayable(appointment);

        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointment.getAppointmentId())
                .orElse(null);

        if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Lịch hẹn này đã được thanh toán thành công trước đó");
        }

        String appTransId = ZaloPayUtil.generateAppTransId(zaloPayConfig.getAppId());

        if (payment == null) {
            payment = Payment.builder()
                    .appointment(appointment)
                    .amount(appointment.getPrice())
                    .status(PaymentStatus.PENDING)
                    .paymentMethod(PaymentMethod.ZALOPAY)
                    .build();
        } else {
            payment.setAmount(appointment.getPrice());
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentMethod(PaymentMethod.ZALOPAY);
            payment.setGatewayTransactionId(null);
            payment.setRefundedAmount(BigDecimal.ZERO);
        }
        payment.setTransactionId(appTransId);
        payment = paymentRepository.save(payment);

        Map<String, Object> zpResponse = callZaloPayCreateOrder(payment, appTransId);

        Object orderUrl = zpResponse.get("order_url");
        if (orderUrl == null || String.valueOf(orderUrl).isBlank()) {
            throw new BadRequestException("ZaloPay không trả về order_url");
        }

        return ZaloPayUrlResponse.builder()
                .paymentUrl(String.valueOf(orderUrl))
                .paymentId(payment.getPaymentId())
                .appTransId(appTransId)
                .orderToken(zpResponse.get("order_token") != null
                        ? String.valueOf(zpResponse.get("order_token")) : null)
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callZaloPayCreateOrder(Payment payment, String appTransId) {
        long amount = payment.getAmount().longValue();
        long appTime = System.currentTimeMillis();
        String appUser = "user_" + payment.getAppointment().getAppointmentId();
        String description = "VaxCare - Thanh toan lich hen #" + payment.getAppointment().getAppointmentId();
        String embedData = "{}";
        String item = "[]";

        if (zaloPayConfig.getRedirectUrl() != null && !zaloPayConfig.getRedirectUrl().isBlank()) {
            try {
                Map<String, Object> embed = new HashMap<>();
                embed.put("redirecturl", zaloPayConfig.getRedirectUrl());
                embedData = objectMapper.writeValueAsString(embed);
            } catch (Exception e) {
                log.warn("Không thể build embed_data ZaloPay", e);
            }
        }

        String mac = ZaloPayUtil.buildCreateOrderMac(
                zaloPayConfig.getAppId(), appTransId, appUser, amount, appTime,
                embedData, item, zaloPayConfig.getKey1());

        Map<String, Object> body = new HashMap<>();
        body.put("app_id", Integer.parseInt(zaloPayConfig.getAppId()));
        body.put("app_user", appUser);
        body.put("app_trans_id", appTransId);
        body.put("app_time", appTime);
        body.put("expire_duration_seconds", 900);
        body.put("amount", amount);
        body.put("description", description);
        body.put("callback_url", zaloPayConfig.getCallbackUrl());
        body.put("item", item);
        body.put("embed_data", embedData);
        body.put("bank_code", "");
        body.put("mac", mac);

        try {
            RestClient client = restClientBuilder.build();
            Map<String, Object> response = client.post()
                    .uri(zaloPayConfig.getCreateUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new BadRequestException("ZaloPay không trả về phản hồi");
            }

            int returnCode = response.get("return_code") instanceof Number n ? n.intValue() : -1;
            if (returnCode != 1) {
                String msg = String.valueOf(response.getOrDefault("return_message", "Lỗi tạo đơn ZaloPay"));
                log.error("ZaloPay create failed: return_code={}, message={}, response={}", returnCode, msg, response);
                throw new BadRequestException("ZaloPay: " + msg + " (code=" + returnCode + ")");
            }
            return response;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi gọi API tạo đơn ZaloPay", e);
            throw new BadRequestException("Không thể kết nối cổng thanh toán ZaloPay: " + e.getMessage());
        }
    }

    private String buildVnpayPaymentUrl(Payment payment, String txnRef, HttpServletRequest httpRequest) {
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

    @Transactional
    public String handleReturn(Map<String, String> params) {
        CallbackResult result;
        try {
            result = verifyAndProcessVnpay(params);
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

    @Transactional
    public Map<String, String> handleIpn(Map<String, String> params) {
        Map<String, String> response = new HashMap<>();
        try {
            CallbackResult result = verifyAndProcessVnpay(params);
            response.put("RspCode", result.rspCode);
            response.put("Message", result.message);
        } catch (Exception e) {
            log.error("Lỗi xử lý VNPay IPN", e);
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }
        return response;
    }

    private CallbackResult verifyAndProcessVnpay(Map<String, String> params) {
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

        String vnpTransactionNo = data.get("vnp_TransactionNo");
        if (vnpTransactionNo != null && !vnpTransactionNo.isBlank()) {
            payment.setGatewayTransactionId(vnpTransactionNo);
        }

        Appointment appointment = payment.getAppointment();

        if (isSuccess) {
            return processSuccessfulPayment(payment, appointment, PaymentMethod.VNPAY, txnRef);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new CallbackResult(false, "00", "Thanh toán thất bại hoặc bị hủy", appointment.getAppointmentId());
        }
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> handleZalopayCallback(Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String dataStr = body.get("data") != null ? String.valueOf(body.get("data")) : null;
            String mac = body.get("mac") != null ? String.valueOf(body.get("mac")) : null;

            if (dataStr == null || mac == null) {
                response.put("return_code", -1);
                response.put("return_message", "missing data/mac");
                return response;
            }

            String calculated = ZaloPayUtil.buildCallbackMac(zaloPayConfig.getKey2(), dataStr);
            if (!calculated.equalsIgnoreCase(mac)) {
                log.warn("ZaloPay callback: chữ ký không hợp lệ");
                response.put("return_code", -1);
                response.put("return_message", "mac not match");
                return response;
            }

            Map<String, Object> data = objectMapper.readValue(dataStr, Map.class);
            String appTransId = data.get("app_trans_id") != null ? String.valueOf(data.get("app_trans_id")) : null;
            if (appTransId == null || appTransId.isBlank()) {
                response.put("return_code", -1);
                response.put("return_message", "missing app_trans_id");
                return response;
            }

            Payment payment = paymentRepository.findByTransactionIdForUpdate(appTransId).orElse(null);
            if (payment == null) {
                response.put("return_code", -1);
                response.put("return_message", "order not found");
                return response;
            }

            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                response.put("return_code", 1);
                response.put("return_message", "success");
                return response;
            }

            long expectedAmount = payment.getAmount().longValue();
            long receivedAmount = data.get("amount") instanceof Number n ? n.longValue() : -1;
            if (expectedAmount != receivedAmount) {
                log.warn("ZaloPay amount mismatch: expected={}, received={}, appTransId={}",
                        expectedAmount, receivedAmount, appTransId);
                response.put("return_code", -1);
                response.put("return_message", "amount mismatch");
                return response;
            }

            try {
                payment.setRawResponse(dataStr);
            } catch (Exception e) {
                log.warn("Không thể lưu raw response ZaloPay", e);
            }

            Object zpTransId = data.get("zp_trans_id");
            if (zpTransId != null) {
                payment.setGatewayTransactionId(String.valueOf(zpTransId));
            }

            processSuccessfulPayment(payment, payment.getAppointment(), PaymentMethod.ZALOPAY, appTransId);

            response.put("return_code", 1);
            response.put("return_message", "success");
        } catch (Exception e) {
            log.error("Lỗi xử lý ZaloPay callback", e);
            response.put("return_code", -1);
            response.put("return_message", "internal error");
        }
        return response;
    }

    @Transactional
    public String handleZalopayReturn(Map<String, String> params) {
        String appTransId = params.get("apptransid");
        if (appTransId == null || appTransId.isBlank()) {
            appTransId = params.get("app_trans_id");
        }

        boolean success = false;
        String message = "Không xác định được kết quả thanh toán";
        Long appointmentId = null;

        if (appTransId != null && !appTransId.isBlank()) {
            Payment payment = paymentRepository.findByTransactionIdForUpdate(appTransId).orElse(null);
            if (payment != null) {
                appointmentId = payment.getAppointment().getAppointmentId();

                if (payment.getStatus() == PaymentStatus.SUCCESS) {
                    success = true;
                    message = "Thanh toán thành công";
                    if (payment.getGatewayTransactionId() == null || payment.getGatewayTransactionId().isBlank()) {
                        try {
                            Map<String, Object> queryResult = queryZaloPayOrder(appTransId);
                            Object zpTransId = queryResult.get("zp_trans_id");
                            if (zpTransId != null) {
                                payment.setGatewayTransactionId(String.valueOf(zpTransId));
                                paymentRepository.save(payment);
                                log.info("Đã bổ sung gateway_transaction_id={} cho payment #{}",
                                        zpTransId, payment.getPaymentId());
                            }
                        } catch (Exception e) {
                            log.warn("Không bổ sung được gateway_transaction_id cho payment #{}: {}",
                                    payment.getPaymentId(), e.getMessage());
                        }
                    }
                } else {
                    try {
                        Map<String, Object> queryResult = queryZaloPayOrder(appTransId);
                        int returnCode = queryResult.get("return_code") instanceof Number n
                                ? n.intValue() : -1;
                        // return_code = 1: thành công
                        if (returnCode == 1) {
                            Object zpTransId = queryResult.get("zp_trans_id");
                            if (zpTransId != null) {
                                payment.setGatewayTransactionId(String.valueOf(zpTransId));
                            }
                            try {
                                payment.setRawResponse(objectMapper.writeValueAsString(queryResult));
                            } catch (Exception ignored) {
                            }
                            CallbackResult processed = processSuccessfulPayment(
                                    payment, payment.getAppointment(), PaymentMethod.ZALOPAY, appTransId);
                            success = processed.success;
                            message = processed.message;
                            appointmentId = processed.appointmentId != null
                                    ? processed.appointmentId : appointmentId;
                        } else if (returnCode == 3) {
                            // Đang xử lý
                            message = "Giao dịch đang được xử lý, vui lòng đợi vài giây rồi tải lại";
                        } else {
                            payment.setStatus(PaymentStatus.FAILED);
                            paymentRepository.save(payment);
                            message = String.valueOf(queryResult.getOrDefault(
                                    "return_message", "Thanh toán thất bại hoặc bị hủy"));
                        }
                    } catch (Exception e) {
                        log.error("Lỗi query ZaloPay order appTransId={}", appTransId, e);
                        message = "Không kiểm tra được trạng thái thanh toán. Vui lòng tải lại trang Lịch hẹn sau vài giây.";
                    }
                }
            }
        }

        String base = zaloPayConfig.getFrontendResultUrl();
        String statusParam = success ? "success" : ("failed".equals(message) || message.contains("thất bại") ? "failed" : "pending");
        if (success) {
            statusParam = "success";
        } else if (message != null && (message.toLowerCase().contains("thất bại")
                || message.toLowerCase().contains("hủy")
                || message.toLowerCase().contains("failed"))) {
            statusParam = "failed";
        } else if (!success) {
            statusParam = "pending";
        }

        StringBuilder redirect = new StringBuilder(base)
                .append(base.contains("?") ? "&" : "?")
                .append("status=").append(statusParam)
                .append("&message=").append(java.net.URLEncoder.encode(
                        message != null ? message : "", java.nio.charset.StandardCharsets.UTF_8));
        if (appointmentId != null) {
            redirect.append("&appointmentId=").append(appointmentId);
        }
        if (appTransId != null) {
            redirect.append("&appTransId=").append(appTransId);
        }
        return redirect.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> queryZaloPayOrder(String appTransId) {
        String mac = ZaloPayUtil.buildQueryOrderMac(
                zaloPayConfig.getAppId(), appTransId, zaloPayConfig.getKey1());

        Map<String, Object> body = new HashMap<>();
        body.put("app_id", Integer.parseInt(zaloPayConfig.getAppId()));
        body.put("app_trans_id", appTransId);
        body.put("mac", mac);

        RestClient client = restClientBuilder.build();
        Map<String, Object> response = client.post()
                .uri(zaloPayConfig.getQueryUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new BadRequestException("ZaloPay query không trả về phản hồi");
        }
        log.info("ZaloPay query order appTransId={} return_code={} message={}",
                appTransId, response.get("return_code"), response.get("return_message"));
        return response;
    }

    @Transactional
    public RefundResponse refundPayment(Long paymentId, CreateRefundRequest request,
                                        Long currentAccountId, String createdBy) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán #" + paymentId));

        checkOwnership(payment.getAppointment(), currentAccountId);
        assertRefundEligible(payment);

        ensureGatewayTransactionId(payment);

        if (payment.getGatewayTransactionId() == null || payment.getGatewayTransactionId().isBlank()) {
            if (isSandboxMode()) {

                String fakeId = "SANDBOX-TX-" + payment.getPaymentId();
                payment.setGatewayTransactionId(fakeId);
                paymentRepository.save(payment);
                log.warn("SANDBOX: thiếu gateway_transaction_id → gán giả {} để mô phỏng hoàn tiền",
                        fakeId);
            } else {
                throw new BadRequestException(
                        "Giao dịch thiếu mã cổng thanh toán (gateway_transaction_id). Không thể hoàn tiền tự động. "
                                + "Hệ thống đã thử QueryDR/query order nhưng không lấy được. "
                                + "Nguyên nhân thường gặp: IPN chưa về (localhost), hoặc giao dịch sandbox chưa settle. "
                                + "Vui lòng kiểm tra raw_response / log backend hoặc liên hệ hỗ trợ.");
            }
        }

        // Luôn hoàn toàn bộ
        BigDecimal refundAmount = payment.getAmount();
        String reason = request != null && request.getReason() != null
                ? request.getReason().trim() : "Hoàn tiền do hủy lịch hẹn";
        if (reason.isBlank()) {
            reason = "Hoàn tiền do hủy lịch hẹn";
        }

        payment.setStatus(PaymentStatus.REFUNDING);
        paymentRepository.save(payment);

        Refund refund;
        if (payment.getPaymentMethod() == PaymentMethod.VNPAY) {
            refund = refundViaVnpay(payment, refundAmount, reason, createdBy);
        } else if (payment.getPaymentMethod() == PaymentMethod.ZALOPAY) {
            refund = refundViaZalopay(payment, refundAmount, reason, createdBy);
        } else {
            payment.setStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);
            throw new BadRequestException("Phương thức thanh toán " + payment.getPaymentMethod()
                    + " không hỗ trợ hoàn tiền tự động");
        }

        if (refund.getStatus() == RefundStatus.FAILED) {
            String detail = "";
            if (refund.getRawResponse() != null && !refund.getRawResponse().isBlank()) {
                String raw = refund.getRawResponse();
                if (raw.length() > 300) {
                    raw = raw.substring(0, 300) + "...";
                }
                detail = " Chi tiết cổng: " + raw;
            }
            throw new BadRequestException(
                    "Hoàn tiền thất bại. Lịch hẹn chưa được hủy. Vui lòng thử lại hoặc liên hệ hỗ trợ."
                            + detail);
        }

        return mapRefundToResponse(refund);
    }

    public void assertRefundEligible(Payment payment) {
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException(
                    "Chỉ có thể hoàn tiền giao dịch đã thanh toán thành công (status hiện tại: "
                            + payment.getStatus() + ")");
        }

        Appointment appointment = payment.getAppointment();
        AppointmentStatus st = appointment.getStatus();

        if (st == AppointmentStatus.CHECKED_IN || st == AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Lịch hẹn đã check-in / hoàn tất tiêm chủng, không được hoàn tiền");
        }
        if (st == AppointmentStatus.NO_SHOW) {
            throw new BadRequestException(
                    "Lịch hẹn đã đánh dấu không đến (quá giờ chưa check-in), không được hoàn tiền");
        }
        LocalDateTime slotStart = LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getTimeSlot());
        if (LocalDateTime.now().isAfter(slotStart)) {
            throw new BadRequestException(
                    "Đã quá giờ khung tiêm (" + appointment.getAppointmentDate() + " "
                            + appointment.getTimeSlot() + "), không được hoàn tiền");
        }
    }

    private Refund refundViaVnpay(Payment payment, BigDecimal refundAmount, String reason, String createdBy) {
        String requestId = VNPayUtil.generateTxnRef();
        LocalDateTime now = LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone()));
        String createDate = now.format(VNP_DATE_FORMAT);

        String transactionDate = payment.getPaymentTime() != null
                ? payment.getPaymentTime().format(VNP_DATE_FORMAT)
                : createDate;

        long amountCents = refundAmount.multiply(BigDecimal.valueOf(100)).longValue();
        String transactionNo = payment.getGatewayTransactionId() != null
                ? payment.getGatewayTransactionId() : "0";

        String dataToHash = String.join("|",
                requestId,
                VNPayConfig.VERSION,
                VNPayConfig.COMMAND_REFUND,
                vnPayConfig.getTmnCode(),
                VNPayConfig.REFUND_FULL,
                payment.getTransactionId(),
                String.valueOf(amountCents),
                transactionNo,
                transactionDate,
                createdBy != null ? createdBy : "system",
                createDate,
                "127.0.0.1",
                reason != null ? reason : "Hoan tien lich hen"
        );
        String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), dataToHash);

        Map<String, Object> body = new HashMap<>();
        body.put("vnp_RequestId", requestId);
        body.put("vnp_Version", VNPayConfig.VERSION);
        body.put("vnp_Command", VNPayConfig.COMMAND_REFUND);
        body.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        body.put("vnp_TransactionType", VNPayConfig.REFUND_FULL);
        body.put("vnp_TxnRef", payment.getTransactionId());
        body.put("vnp_Amount", amountCents);
        body.put("vnp_TransactionNo", transactionNo);
        body.put("vnp_TransactionDate", transactionDate);
        body.put("vnp_CreateBy", createdBy != null ? createdBy : "system");
        body.put("vnp_CreateDate", createDate);
        body.put("vnp_IpAddr", "127.0.0.1");
        body.put("vnp_OrderInfo", reason != null ? reason : "Hoan tien lich hen");
        body.put("vnp_SecureHash", secureHash);

        Refund refund = Refund.builder()
                .payment(payment)
                .requestId(requestId)
                .amount(refundAmount)
                .reason(reason)
                .status(RefundStatus.PENDING)
                .createdBy(createdBy)
                .build();
        refund = refundRepository.save(refund);

        try {
            RestClient client = restClientBuilder.build();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.post()
                    .uri(vnPayConfig.getApiUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String raw;
            try {
                raw = objectMapper.writeValueAsString(response);
            } catch (Exception e) {
                raw = String.valueOf(response);
            }
            refund.setRawResponse(raw);

            String responseCode = response != null && response.get("vnp_ResponseCode") != null
                    ? String.valueOf(response.get("vnp_ResponseCode")) : "99";

            if ("00".equals(responseCode)) {
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone())));
                if (response.get("vnp_TransactionNo") != null) {
                    refund.setGatewayRefundId(String.valueOf(response.get("vnp_TransactionNo")));
                }
                applySuccessfulRefund(payment, refundAmount);
            } else if (isSandboxMode()) {
                log.warn("VNPay SANDBOX: responseCode={} → mô phỏng hoàn tiền ảo (payment #{})",
                        responseCode, payment.getPaymentId());
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone())));
                refund.setGatewayRefundId("SANDBOX-MOCK-" + requestId);
                try {
                    refund.setRawResponse(objectMapper.writeValueAsString(Map.of(
                            "sandbox_mock", true,
                            "original_vnp_ResponseCode", responseCode != null ? responseCode : "null",
                            "gateway_response", response != null ? response : Map.of(),
                            "message", "Sandbox simulate refund — VNPay sandbox often restricts refund API"
                    )));
                } catch (Exception ignored) {
                    refund.setRawResponse("{\"sandbox_mock\":true,\"original_vnp_ResponseCode\":\"" + responseCode + "\"}");
                }
                applySuccessfulRefund(payment, refundAmount);
            } else {
                refund.setStatus(RefundStatus.FAILED);
                restorePaymentStatusAfterFailedRefund(payment);
                log.error("VNPay refund failed: responseCode={}, response={}", responseCode, response);
            }
            refundRepository.save(refund);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi gọi API refund VNPay", e);
            if (isSandboxMode()) {
                log.warn("VNPay SANDBOX: exception khi gọi refund → mô phỏng hoàn tiền ảo: {}", e.getMessage());
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone())));
                refund.setGatewayRefundId("SANDBOX-MOCK-EX-" + requestId);
                refund.setRawResponse("{\"sandbox_mock\":true,\"error\":\"" + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}");
                refundRepository.save(refund);
                applySuccessfulRefund(payment, refundAmount);
                return refund;
            }
            refund.setStatus(RefundStatus.FAILED);
            refund.setRawResponse("{\"error\":\"" + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}");
            refundRepository.save(refund);
            restorePaymentStatusAfterFailedRefund(payment);
            throw new BadRequestException("Không thể kết nối VNPay để hoàn tiền: " + e.getMessage());
        }

        return refund;
    }

    @SuppressWarnings("unchecked")
    private Refund refundViaZalopay(Payment payment, BigDecimal refundAmount, String reason, String createdBy) {
        String mRefundId = ZaloPayUtil.generateRefundId(zaloPayConfig.getAppId());
        long timestamp = System.currentTimeMillis();
        long amount = refundAmount.longValue();
        String description = "Hoan tien lich hen VaxCare #" + payment.getAppointment().getAppointmentId();
        if (description.length() > 100) {
            description = description.substring(0, 100);
        }
        String zpTransId = payment.getGatewayTransactionId();
        if (zpTransId == null || zpTransId.isBlank()) {
            throw new BadRequestException(
                    "Thiếu zp_trans_id (gateway_transaction_id). Không thể hoàn tiền ZaloPay. "
                            + "Cần thanh toán thành công và lưu zp_trans_id từ callback/query order.");
        }
        zpTransId = zpTransId.trim();

        boolean zpIdNumeric = zpTransId.chars().allMatch(Character::isDigit);
        if (isSandboxMode() && !zpIdNumeric) {
            log.warn("ZaloPay SANDBOX: zp_trans_id không hợp lệ ({}) → mô phỏng hoàn tiền ảo", zpTransId);
            Refund refund = Refund.builder()
                    .payment(payment)
                    .requestId(mRefundId)
                    .amount(refundAmount)
                    .reason(reason)
                    .status(RefundStatus.SUCCESS)
                    .gatewayRefundId("SANDBOX-MOCK-" + mRefundId)
                    .createdBy(createdBy)
                    .refundedAt(LocalDateTime.now(ZoneId.of(zaloPayConfig.getTimezone())))
                    .rawResponse("{\"sandbox_mock\":true,\"reason\":\"invalid zp_trans_id in sandbox\"}")
                    .build();
            refund = refundRepository.save(refund);
            applySuccessfulRefund(payment, refundAmount);
            return refund;
        }

        String mac = ZaloPayUtil.buildRefundMac(
                zaloPayConfig.getAppId(), zpTransId, amount, description, timestamp, zaloPayConfig.getKey1());

        Map<String, Object> body = new HashMap<>();
        body.put("app_id", Integer.parseInt(zaloPayConfig.getAppId()));
        body.put("m_refund_id", mRefundId);
        if (zpIdNumeric) {
            body.put("zp_trans_id", Long.parseLong(zpTransId));
        } else {
            body.put("zp_trans_id", zpTransId);
        }
        body.put("amount", amount);
        body.put("timestamp", timestamp);
        body.put("description", description);
        body.put("mac", mac);

        // ========== THÊM ĐOẠN NÀY ==========
        String macData = zaloPayConfig.getAppId() + "|" + zpTransId + "|" + amount + "|" + description + "|" + timestamp;
        log.info("ZaloPay refund REQUEST → url={}, macData={}, body={}",
                zaloPayConfig.getRefundUrl(), macData, body);
        // ===================================
        Refund refund = Refund.builder()
                .payment(payment)
                .requestId(mRefundId)
                .amount(refundAmount)
                .reason(reason)
                .status(RefundStatus.PENDING)
                .createdBy(createdBy)
                .build();
        refund = refundRepository.save(refund);

        try {
            RestClient client = restClientBuilder.build();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.post()
                    .uri(zaloPayConfig.getRefundUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            try {
                refund.setRawResponse(objectMapper.writeValueAsString(response));
            } catch (Exception e) {
                refund.setRawResponse(String.valueOf(response));
            }

            int returnCode = extractZaloPayReturnCode(response);
            log.info("ZaloPay /v2/refund m_refund_id={} return_code={} sub={} message={} refund_id={}",
                    mRefundId, returnCode,
                    response != null ? response.get("sub_return_code") : null,
                    response != null ? response.get("return_message") : null,
                    response != null ? response.get("refund_id") : null);

            if (response != null && response.get("refund_id") != null) {
                refund.setGatewayRefundId(String.valueOf(response.get("refund_id")));
            }

            if (returnCode != 2) {
                for (int attempt = 1; attempt <= 12; attempt++) {
                    try {
                        Thread.sleep(1500L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    try {
                        Map<String, Object> queryResp = queryZaloPayRefund(mRefundId);
                        int queryCode = extractZaloPayReturnCode(queryResp);
                        log.info("ZaloPay /v2/query_refund attempt={} m_refund_id={} return_code={} sub={} message={}",
                                attempt, mRefundId, queryCode,
                                queryResp != null ? queryResp.get("sub_return_code") : null,
                                queryResp != null ? queryResp.get("return_message") : null);
                        if (queryCode == 1 || queryCode == 2) {
                            returnCode = queryCode;
                            response = queryResp;
                            try {
                                refund.setRawResponse(objectMapper.writeValueAsString(queryResp));
                            } catch (Exception ignored) {
                                refund.setRawResponse(String.valueOf(queryResp));
                            }
                            if (queryResp != null && queryResp.get("refund_id") != null) {
                                refund.setGatewayRefundId(String.valueOf(queryResp.get("refund_id")));
                            }
                            break;
                        }
                        // 3 = PROCESSING → tiếp tục poll
                    } catch (Exception pollEx) {
                        log.warn("ZaloPay query_refund attempt={} failed: {}", attempt, pollEx.getMessage());
                    }
                }
            }

            if (returnCode == 1) {
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(zaloPayConfig.getTimezone())));
                applySuccessfulRefund(payment, refundAmount);
            } else if (isSandboxMode()) {
                String msg = response != null
                        ? String.valueOf(response.getOrDefault("return_message", "unknown"))
                        : "null response";
                String sub = response != null
                        ? String.valueOf(response.getOrDefault("sub_return_code", ""))
                        : "";
                log.warn("ZaloPay SANDBOX: return_code={}, sub={}, message={} → mô phỏng hoàn tiền ảo (m_refund_id={})",
                        returnCode, sub, msg, mRefundId);
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(zaloPayConfig.getTimezone())));
                if (refund.getGatewayRefundId() == null || refund.getGatewayRefundId().isBlank()) {
                    refund.setGatewayRefundId("SANDBOX-MOCK-" + mRefundId);
                }
                try {
                    Map<String, Object> mockBody = new LinkedHashMap<>();
                    mockBody.put("sandbox_mock", true);
                    mockBody.put("original_return_code", returnCode);
                    mockBody.put("original_sub_return_code", sub);
                    mockBody.put("original_return_message", msg);
                    mockBody.put("message", "Sandbox simulate refund — docs: always confirm via query_refund");
                    if (response != null) {
                        mockBody.put("gateway_response", response);
                    }
                    refund.setRawResponse(objectMapper.writeValueAsString(mockBody));
                } catch (Exception ignored) {
                }
                applySuccessfulRefund(payment, refundAmount);
            } else {
                refund.setStatus(RefundStatus.FAILED);
                restorePaymentStatusAfterFailedRefund(payment);
                String msg = response != null
                        ? String.valueOf(response.getOrDefault("return_message", "unknown"))
                        : "null response";
                String sub = response != null
                        ? String.valueOf(response.getOrDefault("sub_return_code", ""))
                        : "";
                log.error("ZaloPay refund FAILED: return_code={}, sub_return_code={}, message={}, m_refund_id={}",
                        returnCode, sub, msg, mRefundId);
            }
            refundRepository.save(refund);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi gọi API refund ZaloPay", e);
            if (isSandboxMode()) {
                log.warn("ZaloPay SANDBOX: exception → mô phỏng hoàn tiền ảo: {}", e.getMessage());
                refund.setStatus(RefundStatus.SUCCESS);
                refund.setRefundedAt(LocalDateTime.now(ZoneId.of(zaloPayConfig.getTimezone())));
                refund.setGatewayRefundId("SANDBOX-MOCK-EX-" + mRefundId);
                refund.setRawResponse("{\"sandbox_mock\":true,\"error\":\""
                        + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}");
                refundRepository.save(refund);
                applySuccessfulRefund(payment, refundAmount);
                return refund;
            }
            refund.setStatus(RefundStatus.FAILED);
            refund.setRawResponse("{\"error\":\""
                    + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}");
            refundRepository.save(refund);
            restorePaymentStatusAfterFailedRefund(payment);
            throw new BadRequestException("Không thể kết nối ZaloPay để hoàn tiền: " + e.getMessage());
        }

        return refund;
    }

    private int extractZaloPayReturnCode(Map<String, Object> response) {
        if (response == null) {
            return -1;
        }
        Object code = response.get("return_code");
        if (code instanceof Number n) {
            return n.intValue();
        }
        if (code != null) {
            try {
                return Integer.parseInt(String.valueOf(code));
            } catch (NumberFormatException ignored) {
                return -1;
            }
        }
        return -1;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> queryZaloPayRefund(String mRefundId) {
        long timestamp = System.currentTimeMillis();
        String mac = ZaloPayUtil.buildQueryRefundMac(
                zaloPayConfig.getAppId(), mRefundId, timestamp, zaloPayConfig.getKey1());

        Map<String, Object> body = new HashMap<>();
        body.put("app_id", Integer.parseInt(zaloPayConfig.getAppId()));
        body.put("m_refund_id", mRefundId);
        body.put("timestamp", timestamp);
        body.put("mac", mac);

        RestClient client = restClientBuilder.build();
        Map<String, Object> response = client.post()
                .uri(zaloPayConfig.getQueryRefundUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new BadRequestException("ZaloPay query_refund không trả về phản hồi");
        }
        return response;
    }

    private boolean isSandboxMode() {
        String zp = zaloPayConfig.getRefundUrl() != null ? zaloPayConfig.getRefundUrl() : "";
        String vn = vnPayConfig.getApiUrl() != null ? vnPayConfig.getApiUrl() : "";
        return zp.contains("sb-openapi") || zp.contains("sandbox")
                || vn.contains("sandbox.vnpayment");
    }

    private void applySuccessfulRefund(Payment payment, BigDecimal refundAmount) {
        payment.setRefundedAmount(refundAmount);
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
    }

    private void restorePaymentStatusAfterFailedRefund(Payment payment) {
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
    }

    @SuppressWarnings("unchecked")
    private void ensureGatewayTransactionId(Payment payment) {
        if (payment.getGatewayTransactionId() != null && !payment.getGatewayTransactionId().isBlank()) {
            return;
        }

        String fromRaw = extractGatewayIdFromRawResponse(payment);
        if (fromRaw != null && !fromRaw.isBlank()) {
            payment.setGatewayTransactionId(fromRaw);
            paymentRepository.save(payment);
            log.info("Bổ sung gateway_transaction_id={} từ raw_response cho payment #{}",
                    fromRaw, payment.getPaymentId());
            return;
        }

        if (payment.getPaymentMethod() == PaymentMethod.ZALOPAY
                && payment.getTransactionId() != null
                && !payment.getTransactionId().isBlank()) {
            try {
                Map<String, Object> queryResult = queryZaloPayOrder(payment.getTransactionId());
                Object zpTransId = queryResult.get("zp_trans_id");
                if (zpTransId != null && !String.valueOf(zpTransId).isBlank()) {
                    payment.setGatewayTransactionId(String.valueOf(zpTransId));
                    try {
                        payment.setRawResponse(objectMapper.writeValueAsString(queryResult));
                    } catch (Exception ignored) {
                    }
                    paymentRepository.save(payment);
                    log.info("Bổ sung gateway_transaction_id={} từ ZaloPay query cho payment #{}",
                            zpTransId, payment.getPaymentId());
                    return;
                }
            } catch (Exception e) {
                log.warn("Không query được ZaloPay order để lấy zp_trans_id payment #{}: {}",
                        payment.getPaymentId(), e.getMessage());
            }
        }

        if (payment.getPaymentMethod() == PaymentMethod.VNPAY
                && payment.getTransactionId() != null
                && !payment.getTransactionId().isBlank()) {
            try {
                Map<String, Object> queryResult = queryVnpayTransaction(payment);
                if (queryResult != null) {
                    Object vnpNo = queryResult.get("vnp_TransactionNo");
                    String responseCode = queryResult.get("vnp_ResponseCode") != null
                            ? String.valueOf(queryResult.get("vnp_ResponseCode")) : null;
                    if ("00".equals(responseCode)
                            && vnpNo != null
                            && !String.valueOf(vnpNo).isBlank()
                            && !"0".equals(String.valueOf(vnpNo))) {
                        payment.setGatewayTransactionId(String.valueOf(vnpNo));
                        try {
                            payment.setRawResponse(objectMapper.writeValueAsString(queryResult));
                        } catch (Exception ignored) {
                        }
                        paymentRepository.save(payment);
                        log.info("Bổ sung gateway_transaction_id={} từ VNPay QueryDR cho payment #{}",
                                vnpNo, payment.getPaymentId());
                    } else {
                        log.warn("VNPay QueryDR không trả TransactionNo hợp lệ cho payment #{}: responseCode={}, body={}",
                                payment.getPaymentId(), responseCode, queryResult);
                    }
                }
            } catch (Exception e) {
                log.warn("Không query được VNPay QueryDR payment #{}: {}",
                        payment.getPaymentId(), e.getMessage());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> queryVnpayTransaction(Payment payment) {
        String requestId = VNPayUtil.generateTxnRef();
        LocalDateTime now = LocalDateTime.now(ZoneId.of(vnPayConfig.getTimezone()));
        String createDate = now.format(VNP_DATE_FORMAT);

        String transactionDate = payment.getPaymentTime() != null
                ? payment.getPaymentTime().format(VNP_DATE_FORMAT)
                : (payment.getCreatedAt() != null
                ? payment.getCreatedAt().format(VNP_DATE_FORMAT)
                : createDate);

        String orderInfo = "Query giao dich " + payment.getTransactionId();
        String dataToHash = String.join("|",
                requestId,
                VNPayConfig.VERSION,
                VNPayConfig.COMMAND_QUERY,
                vnPayConfig.getTmnCode(),
                payment.getTransactionId(),
                transactionDate,
                createDate,
                "127.0.0.1",
                orderInfo
        );
        String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), dataToHash);

        Map<String, Object> body = new HashMap<>();
        body.put("vnp_RequestId", requestId);
        body.put("vnp_Version", VNPayConfig.VERSION);
        body.put("vnp_Command", VNPayConfig.COMMAND_QUERY);
        body.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        body.put("vnp_TxnRef", payment.getTransactionId());
        body.put("vnp_TransactionDate", transactionDate);
        body.put("vnp_CreateDate", createDate);
        body.put("vnp_IpAddr", "127.0.0.1");
        body.put("vnp_OrderInfo", orderInfo);
        body.put("vnp_SecureHash", secureHash);

        RestClient client = restClientBuilder.build();
        Map<String, Object> response = client.post()
                .uri(vnPayConfig.getApiUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        log.info("VNPay QueryDR txnRef={} responseCode={} transactionNo={}",
                payment.getTransactionId(),
                response != null ? response.get("vnp_ResponseCode") : null,
                response != null ? response.get("vnp_TransactionNo") : null);
        return response;
    }

    @SuppressWarnings("unchecked")
    private String extractGatewayIdFromRawResponse(Payment payment) {
        String raw = payment.getRawResponse();
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> map = objectMapper.readValue(raw, Map.class);
            // ZaloPay
            Object zp = map.get("zp_trans_id");
            if (zp != null && !String.valueOf(zp).isBlank()) {
                return String.valueOf(zp);
            }
            // VNPay
            Object vnp = map.get("vnp_TransactionNo");
            if (vnp != null && !String.valueOf(vnp).isBlank()) {
                return String.valueOf(vnp);
            }
        } catch (Exception e) {
            log.debug("Không parse được raw_response payment #{}: {}", payment.getPaymentId(), e.getMessage());
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsByPayment(Long paymentId, Long currentAccountId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch #" + paymentId));
        checkOwnership(payment.getAppointment(), currentAccountId);
        return refundRepository.findByPayment_PaymentIdOrderByCreatedAtDesc(paymentId)
                .stream()
                .map(this::mapRefundToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsByAppointment(Long appointmentId, Long currentAccountId) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentAccountId);
        return refundRepository.findByPayment_Appointment_AppointmentIdOrderByCreatedAtDesc(appointmentId)
                .stream()
                .map(this::mapRefundToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RefundResponse getRefundById(Long refundId, Long currentAccountId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hoàn tiền #" + refundId));
        checkOwnership(refund.getPayment().getAppointment(), currentAccountId);
        return mapRefundToResponse(refund);
    }

    private CallbackResult processSuccessfulPayment(Payment payment, Appointment appointment,
                                                     PaymentMethod method, String txnRef) {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentMethod(method);
        payment.setPaymentTime(LocalDateTime.now(ZoneId.of(
                method == PaymentMethod.VNPAY ? vnPayConfig.getTimezone() : zaloPayConfig.getTimezone())));
        paymentRepository.save(payment);

        if (!PAYABLE_STATUSES.contains(appointment.getStatus())) {
            log.warn("{} báo thanh toán THÀNH CÔNG cho appointment #{} nhưng lịch hẹn đã ở trạng thái {} "
                            + "-> Cần hoàn tiền. txnRef={}, amount={}",
                    method, appointment.getAppointmentId(), appointment.getStatus(), txnRef, payment.getAmount());
            return new CallbackResult(true, "00",
                    "Thanh toán thành công nhưng lịch hẹn đã không còn hiệu lực (" + appointment.getStatus()
                            + "). Vui lòng liên hệ tổng đài để được hoàn tiền.",
                    appointment.getAppointmentId());
        }

        var facility = appointment.getFacility();
        long bookedCount = appointmentRepository.countBookingsInSlot(
                facility.getFacilityId(),
                appointment.getAppointmentDate(),
                appointment.getTimeSlot(),
                appointment.getAppointmentId());
        int capacity = facility.getCapacityPerSlot() != null ? facility.getCapacityPerSlot() : 0;
        if (bookedCount >= capacity) {
            log.warn("{} thanh toán THÀNH CÔNG cho appointment #{} nhưng slot đã hết.",
                    method, appointment.getAppointmentId());
            return new CallbackResult(true, "00",
                    "Thanh toán thành công nhưng khung giờ này đã hết slot. Vui lòng liên hệ tổng đài VaxCare để được hỗ trợ hoàn tiền hoặc đổi lịch.",
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
    }

    private void validatePayable(Appointment appointment) {
        if (!PAYABLE_STATUSES.contains(appointment.getStatus())) {
            throw new BadRequestException(
                    "Không thể thanh toán lịch hẹn đang ở trạng thái " + appointment.getStatus());
        }
        if (appointment.getPrice() == null || appointment.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Lịch hẹn này chưa có giá vắc xin hợp lệ để thanh toán");
        }
        ensureSlotAvailableForPayment(appointment);
    }

    private void ensureSlotAvailableForPayment(Appointment appointment) {
        var facility = appointment.getFacility();
        long bookedCount = appointmentRepository.countBookingsInSlot(
                facility.getFacilityId(),
                appointment.getAppointmentDate(),
                appointment.getTimeSlot(),
                appointment.getAppointmentId());
        int capacity = facility.getCapacityPerSlot() != null ? facility.getCapacityPerSlot() : 0;
        if (bookedCount >= capacity) {
            throw new BadRequestException(
                    "Khung giờ này đã hết slot trống (do người khác vừa hoàn tất thanh toán trước). Vui lòng hủy lịch hẹn và chọn khung giờ khác.");
        }

        Integer stock = vaccineBatchRepository.sumStockByFacilityAndVaccine(
                facility.getFacilityId(),
                appointment.getVaccine().getVaccineId());
        if (stock == null || stock <= 0) {
            throw new BadRequestException(
                    "Vắc xin này tại cơ sở đã hết tồn kho (do người khác vừa hoàn tất thanh toán). Vui lòng chọn vắc xin/cơ sở khác.");
        }
    }

    private void sendPaymentSuccessNotifications(Payment payment, Appointment appointment) {
        final Long appointmentId = appointment.getAppointmentId();
        final Long userId = appointment.getUser() != null ? appointment.getUser().getUserId() : null;
        final String fullName = appointment.getUser() != null ? appointment.getUser().getFullName() : null;
        final String vaccineName = appointment.getVaccine() != null ? appointment.getVaccine().getVaccineName() : null;
        final BigDecimal amount = payment.getAmount();
        final String txnId = payment.getTransactionId();

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

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByAppointment(Long appointmentId, Long currentAccountId) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentAccountId);

        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn này chưa có giao dịch thanh toán nào"));

        return mapToResponse(payment);
    }

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

    private RefundResponse mapRefundToResponse(Refund refund) {
        return RefundResponse.builder()
                .refundId(refund.getRefundId())
                .paymentId(refund.getPayment().getPaymentId())
                .appointmentId(refund.getPayment().getAppointment().getAppointmentId())
                .requestId(refund.getRequestId())
                .amount(refund.getAmount())
                .reason(refund.getReason())
                .status(refund.getStatus())
                .gatewayRefundId(refund.getGatewayRefundId())
                .createdBy(refund.getCreatedBy())
                .createdAt(refund.getCreatedAt())
                .refundedAt(refund.getRefundedAt())
                .build();
    }

    private record CallbackResult(boolean success, String rspCode, String message, Long appointmentId) {
    }
}