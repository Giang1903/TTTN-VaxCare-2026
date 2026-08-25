package com.vaxcare.feature.ai.client;

import com.vaxcare.feature.ai.client.dto.DispatchRequestDto;
import com.vaxcare.feature.ai.client.dto.DispatchResponseDto;
import com.vaxcare.feature.ai.client.dto.ForecastRequestDto;
import com.vaxcare.feature.ai.client.dto.ForecastResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    public Optional<DispatchResponseDto> getDispatchPrediction(DispatchRequestDto request) {
        try {
            DispatchResponseDto response = aiServiceWebClient.post()
                    .uri("/api/v1/ai/dispatch")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(DispatchResponseDto.class)
                    .block();
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("[AI Service] Gọi AI 1 (/dispatch) thất bại cho facility {} ngày {}: {}",
                    request.getFacilityId(), request.getPredictionDate(), ex.getMessage());
            return Optional.empty();
        }
    }

    public Optional<ForecastResponseDto> getForecast(ForecastRequestDto request) {
        try {
            ForecastResponseDto response = aiServiceWebClient.post()
                    .uri("/api/v1/ai/forecast")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ForecastResponseDto.class)
                    .block();
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("[AI Service] Gọi AI 2 (/forecast) thất bại cho vaccine {} - facility {}: {}",
                    request.getVaccineId(), request.getFacilityId(), ex.getMessage());
            return Optional.empty();
        }
    }
}
