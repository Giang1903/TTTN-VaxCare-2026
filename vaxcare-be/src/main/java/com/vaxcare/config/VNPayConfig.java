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
    @Value("${vnpay.return-url}")
    private String returnUrl;
    @Value("${vnpay.frontend-result-url}")
    private String frontendResultUrl;
    @Value("${vnpay.api-url:https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}")
    private String apiUrl;
    @Value("${vnpay.timezone}")
    private String timezone;
    public static final String VERSION = "2.1.0";
    public static final String COMMAND_PAY = "pay";
    public static final String COMMAND_REFUND = "refund";
    public static final String COMMAND_QUERY = "querydr";
    public static final String CURRENCY_CODE = "VND";
    public static final String ORDER_TYPE = "other";
    public static final String LOCALE = "vn";
    public static final String REFUND_FULL = "02";
    public static final String REFUND_PARTIAL = "03";
}
