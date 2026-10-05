package com.vaxcare.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class MoMoConfig {
    @Value("${momo.partner-code}")
    private String partnerCode;
    @Value("${momo.access-key}")
    private String accessKey;
    @Value("${momo.secret-key}")
    private String secretKey;
    @Value("${momo.create-url}")
    private String createUrl;
    @Value("${momo.redirect-url}")
    private String redirectUrl;
    @Value("${momo.ipn-url}")
    private String ipnUrl;
    @Value("${momo.frontend-result-url}")
    private String frontendResultUrl;
    @Value("${momo.timezone:Asia/Ho_Chi_Minh}")
    private String timezone;
    public static final String REQUEST_TYPE = "captureWallet";
    public static final String LANG = "vi";
}
