package com.vaxcare.feature.ai.service;

import com.vaxcare.feature.ai.client.AiServiceClient;
import com.vaxcare.feature.ai.client.dto.ConsumptionPointDto;
import com.vaxcare.feature.ai.client.dto.ForecastRequestDto;
import com.vaxcare.feature.ai.client.dto.ForecastResponseDto;
import com.vaxcare.feature.ai.config.AiServiceProperties;
import com.vaxcare.feature.ai.entity.DemandForecast;
import com.vaxcare.feature.ai.repository.DemandForecastRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiForecastService {

    private static final int MIN_HISTORY_POINTS = 3;
    private static final int PERIOD_DAYS = 7;

    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final VaccineRepository vaccineRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final AiServiceClient aiServiceClient;
    private final DemandForecastRepository demandForecastRepository;
    private final AiServiceProperties properties;

    @Scheduled(cron = "#{@aiServiceProperties.forecastCron}")
    public void runScheduledForecast() {
        log.info("[CronJob AI2] Bắt đầu chạy dự báo nhu cầu vắc xin tự động");
        generateForecastsForAllCombos();
    }

    @Transactional
    public int generateForecastsForAllCombos() {
        List<Object[]> combos = vaccinationDetailRepository.findDistinctVaccineFacilityCombos();
        int successCount = 0;

        for (Object[] combo : combos) {
            Long vaccineId = ((Number) combo[0]).longValue();
            Long facilityId = ((Number) combo[1]).longValue();
            if (generateForecastForCombo(vaccineId, facilityId)) {
                successCount++;
            }
        }

        log.info("[CronJob AI2] Đã cập nhật dự báo nhu cầu cho {}/{} cặp vaccine-cơ sở",
                successCount, combos.size());
        return successCount;
    }

    private boolean generateForecastForCombo(Long vaccineId, Long facilityId) {
        Optional<Vaccine> vaccineOpt = vaccineRepository.findById(vaccineId);
        Optional<VaccinationFacility> facilityOpt = facilityRepository.findById(facilityId);
        if (vaccineOpt.isEmpty() || facilityOpt.isEmpty()) {
            return false;
        }

        LocalDate toDate = LocalDate.now().minusDays(1);
        LocalDate fromDate = toDate.minusDays(properties.getForecastHistoryDays());

        List<Object[]> rows = vaccinationDetailRepository
                .findDailyConsumption(vaccineId, facilityId, fromDate, toDate);
        if (rows.size() < MIN_HISTORY_POINTS) {
            return false;
        }

        List<ConsumptionPointDto> history = rows.stream()
                .map(row -> ConsumptionPointDto.builder()
                        .periodDate((LocalDate) row[0])
                        .quantity(((Number) row[1]).intValue())
                        .build())
                .toList();

        ForecastRequestDto request = ForecastRequestDto.builder()
                .vaccineId(vaccineId)
                .facilityId(facilityId)
                .history(history)
                .horizonDays(properties.getForecastHorizonDays())
                .periodDays(PERIOD_DAYS)
                .build();

        Optional<ForecastResponseDto> responseOpt = aiServiceClient.getForecast(request);
        if (responseOpt.isEmpty()) {
            return false;
        }

        persistForecast(vaccineOpt.get(), facilityOpt.get(), responseOpt.get());
        return true;
    }

    private void persistForecast(Vaccine vaccine, VaccinationFacility facility, ForecastResponseDto response) {
        // Xoá các dự báo cũ (chưa đối chiếu actual_quantity) trước khi ghi đè bằng kết quả mới nhất
        demandForecastRepository.deleteStaleForecasts(vaccine.getVaccineId(), facility.getFacilityId());

        List<DemandForecast> entities = response.getForecasts().stream()
                .map(period -> DemandForecast.builder()
                        .vaccine(vaccine)
                        .facility(facility)
                        .forecastPeriodStart(period.getForecastPeriodStart())
                        .forecastPeriodEnd(period.getForecastPeriodEnd())
                        .predictedQuantity(period.getPredictedQuantity())
                        .confidenceLevel(period.getConfidenceLevel() != null
                                ? BigDecimal.valueOf(period.getConfidenceLevel()) : null)
                        .modelVersion(response.getModelVersion())
                        .build())
                .toList();

        demandForecastRepository.saveAll(entities);
    }
}
