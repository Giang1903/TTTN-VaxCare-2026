package com.vaxcare.feature.ai.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AiServiceConfig {

    private final AiServiceProperties properties;
    private final ObjectMapper objectMapper;

    @Bean
    public WebClient aiServiceWebClient() {
        return buildWebClient(properties.getResponseTimeoutMs());
    }

    @Bean
    public WebClient aiChatbotWebClient() {
        return buildWebClient(properties.getChatbotResponseTimeoutMs());
    }

    private WebClient buildWebClient(int responseTimeoutMs) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, properties.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(responseTimeoutMs));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(clientCodecConfigurer -> {
                    clientCodecConfigurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper));
                    clientCodecConfigurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper));
                    clientCodecConfigurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024);
                })
                .build();

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies);

        if (properties.getInternalApiKey() != null && !properties.getInternalApiKey().isBlank()) {
            builder.defaultHeader("X-API-Key", properties.getInternalApiKey().trim());
        }

        return builder.build();
    }
}
