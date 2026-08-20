package com.vaxcare.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class VNPayConfig {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    /** URL BE (endpoint /vnpay-return) mà VNPay sẽ redirect trình duyệt người dùng về sau khi thanh toán. */
    @Value("${vnpay.return-url}")
    private String returnUrl;

    /** URL màn hình kết quả bên FE, BE sẽ redirect tiếp sang đây sau khi xử lý xong return URL. */
    @Value("${vnpay.frontend-result-url}")
    private String frontendResultUrl;

    @Value("${vnpay.timezone}")
    private String timezone;

    public static final String VERSION = "2.1.0";
    public static final String COMMAND_PAY = "pay";
    public static final String CURRENCY_CODE = "VND";
    public static final String ORDER_TYPE = "other";
    public static final String LOCALE = "vn";
}
