package com.vaxcare.feature.dashboard.service;

import com.vaxcare.common.enums.*;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import com.vaxcare.feature.ai.repository.DemandForecastRepository;
import com.vaxcare.feature.appointment.service.AppointmentService;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.dashboard.dto.*;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import com.vaxcare.feature.inventory.entity.VaccineInventory;
import com.vaxcare.feature.inventory.repository.VaccineBatchRepository;
import com.vaxcare.feature.inventory.repository.VaccineInventoryRepository;
import com.vaxcare.feature.notification.repository.NotificationRepository;
import com.vaxcare.feature.reaction.entity.PostVaccinationReaction;
import com.vaxcare.feature.reaction.repository.ReactionRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.feature.vaccination.repository.VaccinationHistoryRepository;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DashboardService {

    private static final int UPCOMING_APPOINTMENTS_LIMIT = 5;
    private static final int RECENT_VACCINATIONS_LIMIT = 5;
    private static final int EXPIRING_SOON_DAYS = 30;
    private static final int EXPIRING_SOON_LIMIT = 10;
    private static final int DEFAULT_INVENTORY_ALERT_THRESHOLD = 50;
    private static final int FORECAST_HORIZON_DAYS = 14;
    private static final int REVENUE_TREND_MONTHS = 6;

    private final AccountRepository accountRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final VaccinationHistoryRepository vaccinationHistoryRepository;
    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final NotificationRepository notificationRepository;
    private final VaccineInventoryRepository vaccineInventoryRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final ReactionRepository reactionRepository;
    private final PaymentRepository paymentRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineRepository vaccineRepository;
    private final DemandForecastRepository demandForecastRepository;

    // ===================== DASHBOARD USER =====================

    @Transactional(readOnly = true)
    public UserDashboardResponse getUserDashboard(Long currentAccountId) {
        Account account = findAccountOrThrow(currentAccountId);
        if (account.getUser() == null) {
            throw new BadRequestException("Tài khoản này không phải tài khoản người dùng (User)");
        }
        Long userId = account.getUser().getUserId();

        long totalAppointments = appointmentRepository.countByUser_UserId(userId);
        long totalVaccinationsCompleted =
                vaccinationDetailRepository.countByHistory_User_UserIdAndResult(userId, VaccinationResult.SUCCESS);
        long unreadNotifications = notificationRepository.countByAccount_AccountIdAndIsReadFalse(currentAccountId);

        List<AppointmentResponse> upcomingAppointments = appointmentRepository
                .findUpcomingByUserId(userId, LocalDate.now(), List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED))
                .stream()
                .limit(UPCOMING_APPOINTMENTS_LIMIT)
                .map(appointmentService::mapToResponse)
                .toList();

        List<com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse> recentVaccinations =
                vaccinationHistoryRepository.findByUser_UserId(userId)
                        .map(VaccinationHistory::getHistoryId)
                        .map(vaccinationDetailRepository::findAllByHistoryIdWithDetails)
                        .orElseGet(List::of)
                        .stream()
                        .limit(RECENT_VACCINATIONS_LIMIT)
                        .map(this::mapVaccinationDetail)
                        .toList();

        com.vaxcare.feature.dashboard.dto.AiRecommendationDto aiRecommendation = buildAiRecommendation(userId);

        return UserDashboardResponse.builder()
                .totalAppointments(totalAppointments)
                .totalVaccinationsCompleted(totalVaccinationsCompleted)
                .unreadNotifications(unreadNotifications)
                .upcomingAppointments(upcomingAppointments)
                .recentVaccinations(recentVaccinations)
                .aiRecommendation(aiRecommendation)
                .build();
    }

    private com.vaxcare.feature.dashboard.dto.AiRecommendationDto buildAiRecommendation(Long userId) {
        List<VaccinationDetail> historyDetails = vaccinationHistoryRepository.findByUser_UserId(userId)
                .map(VaccinationHistory::getHistoryId)
                .map(vaccinationDetailRepository::findAllByHistoryIdWithDetails)
                .orElseGet(List::of);

        Vaccine recommendedVaccine = null;
        Integer nextDoseNumber = 1;
        LocalDate earliestDate = LocalDate.now().plusDays(2);

        Map<Long, Integer> doseCountMap = new HashMap<>();
        Map<Long, LocalDate> lastDateMap = new HashMap<>();
        Map<Long, Vaccine> vaccineMap = new HashMap<>();

        for (VaccinationDetail d : historyDetails) {
            if (d.getResult() == VaccinationResult.SUCCESS) {
                Long vId = d.getVaccine().getVaccineId();
                doseCountMap.put(vId, doseCountMap.getOrDefault(vId, 0) + 1);
                vaccineMap.put(vId, d.getVaccine());
                LocalDate date = d.getInjectionDate();
                if (date != null && (!lastDateMap.containsKey(vId) || date.isAfter(lastDateMap.get(vId)))) {
                    lastDateMap.put(vId, date);
                }
            }
        }

        for (Map.Entry<Long, Integer> entry : doseCountMap.entrySet()) {
            Vaccine v = vaccineMap.get(entry.getKey());
            int taken = entry.getValue();
            int req = v.getRequiredDoses() != null ? v.getRequiredDoses() : 1;
            if (taken < req) {
                recommendedVaccine = v;
                nextDoseNumber = taken + 1;
                LocalDate lastInj = lastDateMap.get(entry.getKey());
                if (lastInj != null && v.getDoseIntervalDays() != null && v.getDoseIntervalDays() > 0) {
                    LocalDate intervalDate = lastInj.plusDays(v.getDoseIntervalDays());
                    if (intervalDate.isAfter(earliestDate)) {
                        earliestDate = intervalDate;
                    }
                }
                break;
            }
        }

        if (recommendedVaccine == null) {
            List<Vaccine> activeVaccines = vaccineRepository.findByStatus(ActiveStatus.ACTIVE);
            for (Vaccine v : activeVaccines) {
                if (!doseCountMap.containsKey(v.getVaccineId())) {
                    recommendedVaccine = v;
                    nextDoseNumber = 1;
                    break;
                }
            }
            if (recommendedVaccine == null && !activeVaccines.isEmpty()) {
                recommendedVaccine = activeVaccines.get(0);
            }
        }

        if (recommendedVaccine == null) {
            return null;
        }

        List<VaccinationFacility> facilities = facilityRepository.findByStatus(ActiveStatus.ACTIVE);
        VaccinationFacility targetFacility = !facilities.isEmpty() ? facilities.get(0) : null;
        if (targetFacility == null) {
            return null;
        }

        LocalTime timeSlot = LocalTime.of(8, 30);
        if (targetFacility.getOpeningTime() != null) {
            timeSlot = targetFacility.getOpeningTime();
        }

        return com.vaxcare.feature.dashboard.dto.AiRecommendationDto.builder()
                .vaccineId(recommendedVaccine.getVaccineId())
                .vaccineName(recommendedVaccine.getVaccineName())
                .doseNumber(nextDoseNumber)
                .facilityId(targetFacility.getFacilityId())
                .facilityName(targetFacility.getFacilityName())
                .recommendedDate(earliestDate)
                .recommendedTimeSlot(timeSlot)
                .description("Xác suất còn chỗ cao, thời gian chờ dự kiến thấp.")
                .build();
    }

    // ===================== DASHBOARD STAFF =====================

    @Transactional(readOnly = true)
    public StaffDashboardResponse getStaffDashboard(Long currentAccountId, Long requestedFacilityId, LocalDate targetDate) {
        Account account = findAccountOrThrow(currentAccountId);
        Long facilityId = resolveEffectiveFacilityId(account, requestedFacilityId);
        LocalDate date = targetDate != null ? targetDate : LocalDate.now();

        VaccinationFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở tiêm chủng với ID: " + facilityId));

        List<AppointmentStatusCount> appointmentsToday = appointmentRepository
                .countByFacilityAndDateGroupByStatus(facilityId, date).stream()
                .map(row -> AppointmentStatusCount.builder()
                        .status((AppointmentStatus) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        List<VaccinationResultCount> vaccinationsTodayByResult = vaccinationDetailRepository
                .countByFacilityAndDateGroupByResult(facilityId, date).stream()
                .map(row -> VaccinationResultCount.builder()
                        .result((VaccinationResult) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();
        long totalVaccinationsToday = vaccinationsTodayByResult.stream()
                .mapToLong(VaccinationResultCount::getCount)
                .sum();

        int alertThreshold = vaccineInventoryRepository.findByFacility_FacilityId(facilityId)
                .map(VaccineInventory::getAlertThreshold)
                .orElse(DEFAULT_INVENTORY_ALERT_THRESHOLD);

        List<VaccineStockItem> inventorySummary = vaccineBatchRepository
                .sumStockGroupByVaccineWithName(facilityId).stream()
                .map(row -> {
                    int stock = ((Number) row[2]).intValue();
                    return VaccineStockItem.builder()
                            .vaccineId((Long) row[0])
                            .vaccineName((String) row[1])
                            .stockQuantity(stock)
                            .lowStock(stock <= alertThreshold)
                            .build();
                })
                .toList();

        List<ExpiringBatchItem> expiringSoonBatches = vaccineBatchRepository
                .findExpiringSoon(facilityId, date, date.plusDays(EXPIRING_SOON_DAYS)).stream()
                .limit(EXPIRING_SOON_LIMIT)
                .map(this::mapExpiringBatch)
                .toList();

        List<PostVaccinationReaction> unresolvedReactions = reactionRepository.findAllForStaff(facilityId, null).stream()
                .filter(r -> r.getProcessingStatus() != ReactionProcessingStatus.RESOLVED)
                .toList();

        List<ReactionSeverityCount> unresolvedBySeverity = unresolvedReactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(PostVaccinationReaction::getSeverity, java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .map(e -> ReactionSeverityCount.builder().severity(e.getKey()).count(e.getValue()).build())
                .toList();

        return StaffDashboardResponse.builder()
                .facilityId(facility.getFacilityId())
                .facilityName(facility.getFacilityName())
                .date(date)
                .appointmentsToday(appointmentsToday)
                .totalVaccinationsToday(totalVaccinationsToday)
                .vaccinationsTodayByResult(vaccinationsTodayByResult)
                .inventorySummary(inventorySummary)
                .expiringSoonBatches(expiringSoonBatches)
                .unresolvedReactionsCount(unresolvedReactions.size())
                .unresolvedReactionsBySeverity(unresolvedBySeverity)
                .build();
    }

    // ===================== DASHBOARD ADMIN =====================

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard(LocalDate from, LocalDate to) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.withDayOfMonth(1);
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new BadRequestException("Ngày bắt đầu (from) không được sau ngày kết thúc (to)");
        }

        long totalUsers = accountRepository.countByRole(Role.USER);
        long totalMedicalStaff = accountRepository.countByRole(Role.MEDICAL_STAFF);
        long totalActiveFacilities = facilityRepository.countByStatus(ActiveStatus.ACTIVE);
        long totalActiveVaccines = vaccineRepository.countByStatus(ActiveStatus.ACTIVE);
        YearMonth toYearMonth = YearMonth.from(effectiveTo);
        LocalDate sixMonthsAgoStart = toYearMonth.minusMonths(REVENUE_TREND_MONTHS - 1L).atDay(1);
        LocalDate queryFrom = effectiveFrom.isBefore(sixMonthsAgoStart) ? effectiveFrom : sixMonthsAgoStart;

        List<Payment> successfulPayments = paymentRepository
                .findByStatusAndPaymentTimeGreaterThanEqual(PaymentStatus.SUCCESS, queryFrom.atStartOfDay());

        BigDecimal totalRevenue = successfulPayments.stream()
                .filter(p -> p.getPaymentTime() != null)
                .filter(p -> !p.getPaymentTime().toLocalDate().isBefore(effectiveFrom)
                        && !p.getPaymentTime().toLocalDate().isAfter(effectiveTo))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<YearMonth, BigDecimal> trendMap = new LinkedHashMap<>();
        for (int i = REVENUE_TREND_MONTHS - 1; i >= 0; i--) {
            trendMap.put(toYearMonth.minusMonths(i), BigDecimal.ZERO);
        }
        for (Payment p : successfulPayments) {
            if (p.getPaymentTime() == null) continue;
            YearMonth ym = YearMonth.from(p.getPaymentTime());
            trendMap.computeIfPresent(ym, (k, v) -> v.add(p.getAmount()));
        }
        List<RevenuePoint> revenueTrend = trendMap.entrySet().stream()
                .map(e -> RevenuePoint.builder().period(e.getKey().toString()).amount(e.getValue()).build())
                .toList();

        long totalVaccinations = vaccinationDetailRepository
                .countByResultAndInjectionDateBetween(VaccinationResult.SUCCESS, effectiveFrom, effectiveTo);

        List<AppointmentStatusCount> appointmentsByStatus = appointmentRepository
                .countGroupByStatusInRange(effectiveFrom, effectiveTo).stream()
                .map(row -> AppointmentStatusCount.builder()
                        .status((AppointmentStatus) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        LocalDate forecastFrom = LocalDate.now();
        LocalDate forecastTo = forecastFrom.plusDays(FORECAST_HORIZON_DAYS);
        Map<Long, Integer> forecastByVaccine = new LinkedHashMap<>();
        for (Object[] row : demandForecastRepository.sumPredictedQuantityByVaccineBetween(forecastFrom, forecastTo)) {
            Long vaccineId = (Long) row[0];
            int predicted = ((Number) row[1]).intValue();
            forecastByVaccine.put(vaccineId, predicted);
        }

        List<StockVsForecastItem> stockVsForecast = vaccineBatchRepository
                .sumStockGroupByVaccineSystemWide().stream()
                .map(row -> {
                    Long vaccineId = (Long) row[0];
                    int currentStock = ((Number) row[2]).intValue();
                    Integer aiDemand = forecastByVaccine.get(vaccineId);
                    String note;
                    if (aiDemand == null) {
                        note = "Chưa có dữ liệu dự báo AI — chạy job forecast hoặc gọi API Admin AI";
                    } else if (currentStock < aiDemand) {
                        note = "Tồn kho thấp hơn nhu cầu dự báo " + FORECAST_HORIZON_DAYS + " ngày tới";
                    } else {
                        note = "Đủ tồn so với nhu cầu dự báo " + FORECAST_HORIZON_DAYS + " ngày tới";
                    }
                    return StockVsForecastItem.builder()
                            .vaccineId(vaccineId)
                            .vaccineName((String) row[1])
                            .currentStock(currentStock)
                            .aiForecastedDemand(aiDemand)
                            .note(note)
                            .build();
                })
                .toList();

        return AdminDashboardResponse.builder()
                .from(effectiveFrom)
                .to(effectiveTo)
                .totalUsers(totalUsers)
                .totalMedicalStaff(totalMedicalStaff)
                .totalActiveFacilities(totalActiveFacilities)
                .totalActiveVaccines(totalActiveVaccines)
                .totalRevenue(totalRevenue)
                .revenueTrend(revenueTrend)
                .totalVaccinations(totalVaccinations)
                .appointmentsByStatus(appointmentsByStatus)
                .stockVsForecast(stockVsForecast)
                .build();
    }

    // ===================== HELPERS =====================

    private Long resolveEffectiveFacilityId(Account account, Long requestedFacilityId) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = account.getMedicalStaff();
            if (staff == null || staff.getFacility() == null) {
                throw new BadRequestException("Tài khoản nhân viên y tế này chưa được gán cơ sở tiêm chủng!");
            }
            return staff.getFacility().getFacilityId();
        }

        if (requestedFacilityId == null) {
            throw new BadRequestException("Vui lòng chọn facilityId để xem Dashboard của cơ sở cụ thể");
        }
        return requestedFacilityId;
    }

    private Account findAccountOrThrow(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
    }

    private com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse mapVaccinationDetail(VaccinationDetail detail) {
        Appointment appointment = detail.getAppointment();
        return com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse.builder()
                .detailId(detail.getDetailId())
                .historyId(detail.getHistory().getHistoryId())
                .appointmentId(appointment != null ? appointment.getAppointmentId() : null)
                .vaccineId(detail.getVaccine().getVaccineId())
                .vaccineName(detail.getVaccine().getVaccineName())
                .batchId(detail.getBatch() != null ? detail.getBatch().getBatchId() : null)
                .batchNumber(detail.getBatch() != null ? detail.getBatch().getBatchNumber() : null)
                .facilityId(appointment != null ? appointment.getFacility().getFacilityId() : null)
                .facilityName(appointment != null ? appointment.getFacility().getFacilityName() : null)
                .staffId(detail.getStaff() != null ? detail.getStaff().getStaffId() : null)
                .staffName(detail.getStaff() != null ? detail.getStaff().getFullName() : null)
                .doseNumber(detail.getDoseNumber())
                .requiredDoses(detail.getVaccine() != null ? detail.getVaccine().getRequiredDoses() : 1)
                .injectionDate(detail.getInjectionDate())
                .result(detail.getResult())
                .note(detail.getNote())
                .certificateCode(detail.getCertificateCode())
                .createdAt(detail.getCreatedAt())
                .build();
    }

    private ExpiringBatchItem mapExpiringBatch(VaccineBatch batch) {
        return ExpiringBatchItem.builder()
                .batchId(batch.getBatchId())
                .vaccineName(batch.getVaccine().getVaccineName())
                .batchNumber(batch.getBatchNumber())
                .expiryDate(batch.getExpiryDate())
                .stockQuantity(batch.getStockQuantity())
                .build();
    }
}