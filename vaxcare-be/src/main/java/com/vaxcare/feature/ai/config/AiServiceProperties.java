package com.vaxcare.feature.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai.service")
@Getter
@Setter
public class AiServiceProperties {
    private String baseUrl = "http://localhost:8000";
    private int connectTimeoutMs = 3000;
    private int responseTimeoutMs = 5000;
    private int forecastHistoryDays = 180;
    private int forecastHorizonDays = 14;
    private String forecastCron = "0 0 1 * * *";
}
