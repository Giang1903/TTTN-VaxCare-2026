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
import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private static final long CIRCUIT_COOLDOWN_MS = 20_000L;

    private final WebClient aiServiceWebClient;

    private final AtomicLong dispatchCircuitOpenUntilEpochMs = new AtomicLong(0L);
    private final AtomicLong forecastCircuitOpenUntilEpochMs = new AtomicLong(0L);

    public Optional<DispatchResponseDto> getDispatchPrediction(DispatchRequestDto request) {
        if (isCircuitOpen(dispatchCircuitOpenUntilEpochMs)) {
            log.debug("[AI Service] Mạch AI 1 (/dispatch) đang mở (AI service gần đây đang lỗi/treo) "
                    + "-> bỏ qua gọi AI, dùng slot gốc không có gợi ý ngay lập tức.");
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
            log.warn("[AI Service] Gọi AI 1 (/dispatch) thất bại cho facility {} ngày {}: {}",
                    request.getFacilityId(), request.getPredictionDate(), ex.getMessage());
            openCircuit(dispatchCircuitOpenUntilEpochMs);
            return Optional.empty();
        }
    }

    public Optional<ForecastResponseDto> getForecast(ForecastRequestDto request) {
        if (isCircuitOpen(forecastCircuitOpenUntilEpochMs)) {
            log.debug("[AI Service] Mạch AI 2 (/forecast) đang mở (AI service gần đây đang lỗi/treo) "
                    + "-> bỏ qua gọi AI cho vaccine {} - facility {}.",
                    request.getVaccineId(), request.getFacilityId());
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
            log.warn("[AI Service] Gọi AI 2 (/forecast) thất bại cho vaccine {} - facility {}: {}",
                    request.getVaccineId(), request.getFacilityId(), ex.getMessage());
            openCircuit(forecastCircuitOpenUntilEpochMs);
            return Optional.empty();
        }
    }

    private boolean isCircuitOpen(AtomicLong circuitOpenUntilEpochMs) {
        return System.currentTimeMillis() < circuitOpenUntilEpochMs.get();
    }

    private void openCircuit(AtomicLong circuitOpenUntilEpochMs) {
        circuitOpenUntilEpochMs.set(System.currentTimeMillis() + CIRCUIT_COOLDOWN_MS);
    }
}
