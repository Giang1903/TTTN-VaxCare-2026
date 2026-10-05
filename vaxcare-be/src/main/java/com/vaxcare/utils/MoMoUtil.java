package com.vaxcare.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

public final class MoMoUtil {

    private MoMoUtil() {
    }

    public static String hmacSHA256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] result = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký MoMo (HMAC-SHA256)", e);
        }
    }

    public static String buildCreateSignatureRaw(
            String accessKey,
            String amount,
            String extraData,
            String ipnUrl,
            String orderId,
            String orderInfo,
            String partnerCode,
            String redirectUrl,
            String requestId,
            String requestType) {
        return "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;
    }

    public static String buildCallbackSignatureRaw(
            String accessKey,
            String amount,
            String extraData,
            String message,
            String orderId,
            String orderInfo,
            String orderType,
            String partnerCode,
            String payType,
            String requestId,
            String responseTime,
            String resultCode,
            String transId) {
        return "accessKey=" + nullToEmpty(accessKey)
                + "&amount=" + nullToEmpty(amount)
                + "&extraData=" + nullToEmpty(extraData)
                + "&message=" + nullToEmpty(message)
                + "&orderId=" + nullToEmpty(orderId)
                + "&orderInfo=" + nullToEmpty(orderInfo)
                + "&orderType=" + nullToEmpty(orderType)
                + "&partnerCode=" + nullToEmpty(partnerCode)
                + "&payType=" + nullToEmpty(payType)
                + "&requestId=" + nullToEmpty(requestId)
                + "&responseTime=" + nullToEmpty(responseTime)
                + "&resultCode=" + nullToEmpty(resultCode)
                + "&transId=" + nullToEmpty(transId);
    }

    public static String generateOrderId() {
        long timestamp = System.currentTimeMillis();
        int random = new SecureRandom().nextInt(900000) + 100000;
        return "MOMO" + timestamp + random;
    }

    public static String generateRequestId() {
        long timestamp = System.currentTimeMillis();
        int random = new SecureRandom().nextInt(900000) + 100000;
        return String.valueOf(timestamp) + random;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
