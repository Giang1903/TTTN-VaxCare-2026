package com.vaxcare.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class ZaloPayConfig {

    @Value("${zalopay.app-id}")
    private String appId;

    @Value("${zalopay.key1}")
    private String key1;

    @Value("${zalopay.key2}")
    private String key2;

    @Value("${zalopay.create-url}")
    private String createUrl;

    @Value("${zalopay.query-url:https://sb-openapi.zalopay.vn/v2/query}")
    private String queryUrl;

    @Value("${zalopay.refund-url}")
    private String refundUrl;

    @Value("${zalopay.query-refund-url:https://sb-openapi.zalopay.vn/v2/query_refund}")
    private String queryRefundUrl;

    @Value("${zalopay.callback-url}")
    private String callbackUrl;

    @Value("${zalopay.frontend-result-url}")
    private String frontendResultUrl;

    @Value("${zalopay.redirect-url:}")
    private String redirectUrl;

    @Value("${zalopay.timezone:Asia/Ho_Chi_Minh}")
    private String timezone;
}