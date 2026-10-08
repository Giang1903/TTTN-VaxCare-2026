package com.vaxcare.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class ZaloPayUtil {

    private static final DateTimeFormatter APP_TRANS_PREFIX = DateTimeFormatter.ofPattern("yyMMdd");

    private ZaloPayUtil() {
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
            throw new IllegalStateException("Không thể tạo chữ ký ZaloPay (HMAC-SHA256)", e);
        }
    }

    public static String buildCreateOrderMac(
            String appId, String appTransId, String appUser, long amount,
            long appTime, String embedData, String item, String key1) {
        String data = appId + "|" + appTransId + "|" + appUser + "|" + amount + "|"
                + appTime + "|" + embedData + "|" + item;
        return hmacSHA256(key1, data);
    }

    public static String buildCallbackMac(String key2, String data) {
        return hmacSHA256(key2, data);
    }

    public static String buildRefundMac(
            String appId, String zpTransId, long amount, String description,
            long timestamp, String key1) {
        String data = appId + "|" + zpTransId + "|" + amount + "|" + description + "|" + timestamp;
        return hmacSHA256(key1, data);
    }

    public static String buildQueryOrderMac(String appId, String appTransId, String key1) {
        String data = appId + "|" + appTransId + "|" + key1;
        return hmacSHA256(key1, data);
    }

    public static String buildQueryRefundMac(String appId, String mRefundId, long timestamp, String key1) {
        String data = appId + "|" + mRefundId + "|" + timestamp;
        return hmacSHA256(key1, data);
    }

    public static String generateAppTransId(String appId) {
        String prefix = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(APP_TRANS_PREFIX);
        int random = new SecureRandom().nextInt(900000) + 100000;
        return prefix + "_" + appId + "_" + random + System.currentTimeMillis() % 10000;
    }

    public static String generateRefundId(String appId) {
        String prefix = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(APP_TRANS_PREFIX);
        int random = new SecureRandom().nextInt(900000) + 100000;
        return prefix + "_" + appId + "_" + random + System.currentTimeMillis() % 10000;
    }
}