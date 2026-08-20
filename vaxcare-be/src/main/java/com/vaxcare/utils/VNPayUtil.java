package com.vaxcare.utils;

import jakarta.servlet.http.HttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Map;
import java.util.TreeMap;

/**
 * Helper thuần túy cho tích hợp VNPay: ký HMAC-SHA512, build query string đã sort theo alphabet
 * (bắt buộc theo chuẩn checksum của VNPay), sinh mã giao dịch (vnp_TxnRef) và lấy IP người dùng.
 * Tham khảo tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
public final class VNPayUtil {

    private VNPayUtil() {
    }

    /**
     * Ký HMAC-SHA512 dữ liệu bằng secret key, dùng để tạo vnp_SecureHash khi tạo URL thanh toán
     * và để verify chữ ký khi nhận callback (return/IPN) từ VNPay.
     */
    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPay (HMAC-SHA512)", e);
        }
    }

    /**
     * Build "hashData" (chuỗi field=value nối bằng '&', KHÔNG encode key, value được URL-encode)
     * từ params đã sort theo key alphabet - đây là chuỗi thực sự được đưa vào hmacSHA512 để ký.
     */
    public static String buildHashData(Map<String, String> params) {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) {
                continue;
            }
            if (!first) {
                sb.append('&');
            }
            sb.append(entry.getKey())
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            first = false;
        }
        return sb.toString();
    }

    /** Sinh mã giao dịch (vnp_TxnRef) duy nhất: timestamp + random 6 số, VNPay yêu cầu unique trong ngày. */
    public static String generateTxnRef() {
        long timestamp = System.currentTimeMillis();
        int random = new SecureRandom().nextInt(900000) + 100000;
        return timestamp + "" + random;
    }

    /** Lấy IP thực của client, có xét header X-Forwarded-For khi chạy sau proxy/load balancer. */
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else {
            ip = ip.split(",")[0].trim();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "127.0.0.1";
        }
        return ip;
    }
}
