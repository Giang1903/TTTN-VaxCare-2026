package com.vaxcare.feature.ai.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.ai.dto.DemandForecastResponse;
import com.vaxcare.feature.ai.entity.DemandForecast;
import com.vaxcare.feature.ai.repository.DemandForecastRepository;
import com.vaxcare.feature.ai.service.AiForecastService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "26. Admin - AI Forecast", description = "Xem/điều khiển dự báo nhu cầu vắc xin (AI 2)")
public class AdminAiForecastController {

    private final AiForecastService aiForecastService;
    private final DemandForecastRepository demandForecastRepository;

    @GetMapping("/forecasts")
    public ApiResponse<List<DemandForecastResponse>> getForecasts(
            @RequestParam Long vaccineId,
            @RequestParam Long facilityId) {
        List<DemandForecastResponse> data = demandForecastRepository
                .findByVaccineAndFacilityWithDetails(vaccineId, facilityId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success("Lấy dữ liệu dự báo nhu cầu vắc xin thành công", data);
    }

    @PostMapping("/forecasts/run")
    public ApiResponse<Map<String, Integer>> runForecastNow() {
        int updated = aiForecastService.generateForecastsForAllCombos();
        return ApiResponse.success("Đã chạy dự báo nhu cầu vắc xin thủ công",
                Map.of("updatedCombos", updated));
    }

    private DemandForecastResponse toResponse(DemandForecast f) {
        return DemandForecastResponse.builder()
                .forecastId(f.getForecastId())
                .vaccineId(f.getVaccine().getVaccineId())
                .vaccineName(f.getVaccine().getVaccineName())
                .facilityId(f.getFacility().getFacilityId())
                .facilityName(f.getFacility().getFacilityName())
                .forecastPeriodStart(f.getForecastPeriodStart())
                .forecastPeriodEnd(f.getForecastPeriodEnd())
                .predictedQuantity(f.getPredictedQuantity())
                .actualQuantity(f.getActualQuantity())
                .confidenceLevel(f.getConfidenceLevel())
                .modelVersion(f.getModelVersion())
                .build();
    }
}
