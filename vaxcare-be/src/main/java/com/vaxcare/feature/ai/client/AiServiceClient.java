package com.vaxcare.feature.ai.client;

import com.vaxcare.feature.ai.client.dto.DispatchRequestDto;
import com.vaxcare.feature.ai.client.dto.DispatchResponseDto;
import com.vaxcare.feature.ai.client.dto.ForecastRequestDto;
import com.vaxcare.feature.ai.client.dto.ForecastResponseDto;
import com.vaxcare.feature.chatbot.dto.AiChatRequestDto;
import com.vaxcare.feature.chatbot.dto.AiChatResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Slf4j
public class AiServiceClient {

    private static final long CIRCUIT_COOLDOWN_MS = 20_000L;
    private static final long CHAT_CIRCUIT_COOLDOWN_MS = 15_000L;

    private final WebClient aiServiceWebClient;
    private final WebClient aiChatbotWebClient;

    private final AtomicLong dispatchCircuitOpenUntilEpochMs = new AtomicLong(0L);
    private final AtomicLong forecastCircuitOpenUntilEpochMs = new AtomicLong(0L);
    private final AtomicLong chatCircuitOpenUntilEpochMs = new AtomicLong(0L);

    public AiServiceClient(
            @Qualifier("aiServiceWebClient") WebClient aiServiceWebClient,
            @Qualifier("aiChatbotWebClient") WebClient aiChatbotWebClient) {
        this.aiServiceWebClient = aiServiceWebClient;
        this.aiChatbotWebClient = aiChatbotWebClient;
    }

    public Optional<DispatchResponseDto> getDispatchPrediction(DispatchRequestDto request) {
        if (isCircuitOpen(dispatchCircuitOpenUntilEpochMs)) {
            log.debug("[AI Service] Mạch AI 1 (/dispatch) đang mở -> bỏ qua gọi AI.");
            return Optional.empty();
        }
        try {
            DispatchResponseDto response = aiServiceWebClient.post()
                    .uri("/api/v1/ai/dispatch")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(DispatchResponseDto.class)
                    .block();
            dispatchCircuitOpenUntilEpochMs.set(0L);
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("[AI Service] Gọi AI 1 (/dispatch) thất bại: {}", ex.getMessage());
            openCircuit(dispatchCircuitOpenUntilEpochMs, CIRCUIT_COOLDOWN_MS);
            return Optional.empty();
        }
    }

    public Optional<ForecastResponseDto> getForecast(ForecastRequestDto request) {
        if (isCircuitOpen(forecastCircuitOpenUntilEpochMs)) {
            log.debug("[AI Service] Mạch AI 2 (/forecast) đang mở -> bỏ qua gọi AI.");
            return Optional.empty();
        }
        try {
            ForecastResponseDto response = aiServiceWebClient.post()
                    .uri("/api/v1/ai/forecast")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ForecastResponseDto.class)
                    .block();
            forecastCircuitOpenUntilEpochMs.set(0L);
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("[AI Service] Gọi AI 2 (/forecast) thất bại: {}", ex.getMessage());
            openCircuit(forecastCircuitOpenUntilEpochMs, CIRCUIT_COOLDOWN_MS);
            return Optional.empty();
        }
    }

    public AiChatResponseDto chat(AiChatRequestDto request) {
        if (isCircuitOpen(chatCircuitOpenUntilEpochMs)) {
            throw new IllegalStateException("Chatbot AI circuit open — service temporarily unavailable");
        }
        try {
            AiChatResponseDto response = aiChatbotWebClient.post()
                    .uri("/api/v1/chatbot/chat")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiChatResponseDto.class)
                    .block();
            chatCircuitOpenUntilEpochMs.set(0L);
            if (response == null) {
                throw new IllegalStateException("Empty response from AI chatbot");
            }
            return response;
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("[AI Service] Gọi chatbot thất bại session={}: {}",
                    request.getSessionId(), ex.getMessage());
            openCircuit(chatCircuitOpenUntilEpochMs, CHAT_CIRCUIT_COOLDOWN_MS);
            throw new IllegalStateException("AI chatbot call failed: " + ex.getMessage(), ex);
        }
    }

    private boolean isCircuitOpen(AtomicLong circuitOpenUntilEpochMs) {
        return System.currentTimeMillis() < circuitOpenUntilEpochMs.get();
    }

    private void openCircuit(AtomicLong circuitOpenUntilEpochMs, long cooldownMs) {
        circuitOpenUntilEpochMs.set(System.currentTimeMillis() + cooldownMs);
    }
}
