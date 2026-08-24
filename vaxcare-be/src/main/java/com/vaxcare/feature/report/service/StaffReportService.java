package com.vaxcare.feature.report.service;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.ReactionSeverity;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.reaction.repository.ReactionRepository;
import com.vaxcare.feature.report.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StaffReportService {

    /** Max inclusive range length to protect DB */
    private static final int MAX_RANGE_DAYS = 366;

    private final AppointmentRepository appointmentRepository;
    private final ReactionRepository reactionRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public StaffReportResponse getReport(Long currentAccountId, Long facilityId,
                                         Integer days, LocalDate fromDateParam, LocalDate toDateParam) {
        Account account = findAccount(currentAccountId);
        ResolvedScope scope = resolveScope(account, facilityId);

        LocalDateRange range = resolveRange(days, fromDateParam, toDateParam);
        LocalDate fromDate = range.from();
        LocalDate toDate = range.to();
        int rangeDays = (int) ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        LocalDate weekFrom = toDate.minusDays(6);
        if (weekFrom.isBefore(fromDate)) {
            weekFrom = fromDate;
        }

        Map<AppointmentStatus, Long> statusCounts = new EnumMap<>(AppointmentStatus.class);
        for (Object[] row : appointmentRepository.countGroupByStatus(scope.facilityId(), fromDate, toDate)) {
            statusCounts.put((AppointmentStatus) row[0], (Long) row[1]);
        }
        long appointments = statusCounts.values().stream().mapToLong(Long::longValue).sum();
        long completed = statusCounts.getOrDefault(AppointmentStatus.COMPLETED, 0L);
        long cancelled = statusCounts.getOrDefault(AppointmentStatus.CANCELLED, 0L)
                + statusCounts.getOrDefault(AppointmentStatus.NO_SHOW, 0L);
        long checkedIn = statusCounts.getOrDefault(AppointmentStatus.CHECKED_IN, 0L);
        long pending = statusCounts.getOrDefault(AppointmentStatus.PENDING, 0L);
        long confirmed = statusCounts.getOrDefault(AppointmentStatus.CONFIRMED, 0L);
        double completionRate = appointments == 0 ? 0.0
                : Math.round((completed * 1000.0 / appointments)) / 10.0;

        StaffReportKpi kpi = StaffReportKpi.builder()
                .appointments(appointments)
                .completed(completed)
                .cancelled(cancelled)
                .checkedIn(checkedIn)
                .pending(pending)
                .confirmed(confirmed)
                .completionRate(completionRate)
                .build();

        List<DailyCountItem> dailySeries = buildDailySeries(
                appointmentRepository.countGroupByDate(scope.facilityId(), fromDate, toDate),
                fromDate, toDate);

        List<DailyCountItem> weekSeries = buildDailySeries(
                appointmentRepository.countGroupByDate(scope.facilityId(), weekFrom, toDate),
                weekFrom, toDate);

        List<VaccineRankItem> ranking = buildVaccineRanking(
                appointmentRepository.countGroupByVaccine(scope.facilityId(), fromDate, toDate));

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();
        List<ReactionSeverityItem> reactionMix = buildReactionMix(
                reactionRepository.countGroupBySeverity(scope.facilityId(), fromTime, toTime));
        long openReactions = reactionRepository.countOpenForStaff(scope.facilityId());

        List<TimeSlotLoadItem> overload = buildOverload(
                appointmentRepository.countGroupByTimeSlot(scope.facilityId(), LocalDate.now()));

        return StaffReportResponse.builder()
                .fromDate(fromDate)
                .toDate(toDate)
                .days(rangeDays)
                .facilityId(scope.facilityId())
                .facilityName(scope.facilityName())
                .kpi(kpi)
                .dailySeries(dailySeries)
                .weekSeries(weekSeries)
                .vaccineRanking(ranking)
                .reactionMix(reactionMix)
                .openReactions(openReactions)
                .todayOverload(overload)
                .build();
    }

    /**
     * Export appointments in range as CSV (UTF-8 BOM for Excel).
     */
    @Transactional(readOnly = true)
    public byte[] exportAppointmentsCsv(Long currentAccountId, Long facilityId,
                                        Integer days, LocalDate fromDateParam, LocalDate toDateParam) {
        Account account = findAccount(currentAccountId);
        ResolvedScope scope = resolveScope(account, facilityId);
        LocalDateRange range = resolveRange(days, fromDateParam, toDateParam);

        List<Appointment> list = appointmentRepository.findInDateRange(
                scope.facilityId(), range.from(), range.to());

        StringBuilder sb = new StringBuilder();
        // BOM so Excel opens UTF-8 correctly
        sb.append('\ufeff');
        sb.append("appointment_id,date,time,status,patient,phone,vaccine,price,qr_code,facility,staff,ai_recommended,note\n");

        for (Appointment a : list) {
            String patient = a.getUser() != null ? nullToEmpty(a.getUser().getFullName()) : "";
            String phone = "";
            if (a.getUser() != null && a.getUser().getAccount() != null) {
                phone = nullToEmpty(a.getUser().getAccount().getPhone());
            }
            String vaccine = a.getVaccine() != null ? nullToEmpty(a.getVaccine().getVaccineName()) : "";
            String facility = a.getFacility() != null ? nullToEmpty(a.getFacility().getFacilityName()) : "";
            String staff = a.getStaff() != null ? nullToEmpty(a.getStaff().getFullName()) : "";
            String price = a.getPrice() != null ? a.getPrice().toPlainString() : "";
            String time = a.getTimeSlot() != null ? a.getTimeSlot().toString() : "";
            String date = a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : "";
            String status = a.getStatus() != null ? a.getStatus().name() : "";
            String ai = Boolean.TRUE.equals(a.getRecommendedByAi()) ? "true" : "false";

            sb.append(csv(a.getAppointmentId()))
                    .append(',').append(csv(date))
                    .append(',').append(csv(time))
                    .append(',').append(csv(status))
                    .append(',').append(csv(patient))
                    .append(',').append(csv(phone))
                    .append(',').append(csv(vaccine))
                    .append(',').append(csv(price))
                    .append(',').append(csv(nullToEmpty(a.getQrCode())))
                    .append(',').append(csv(facility))
                    .append(',').append(csv(staff))
                    .append(',').append(csv(ai))
                    .append(',').append(csv(nullToEmpty(a.getNote())))
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Export summary (KPI + daily + ranking) as CSV.
     */
    @Transactional(readOnly = true)
    public byte[] exportSummaryCsv(Long currentAccountId, Long facilityId,
                                   Integer days, LocalDate fromDateParam, LocalDate toDateParam) {
        StaffReportResponse report = getReport(currentAccountId, facilityId, days, fromDateParam, toDateParam);
        StringBuilder sb = new StringBuilder();
        sb.append('\ufeff');

        sb.append("section,key,value\n");
        sb.append(csv("meta")).append(',').append(csv("fromDate")).append(',').append(csv(report.getFromDate())).append('\n');
        sb.append(csv("meta")).append(',').append(csv("toDate")).append(',').append(csv(report.getToDate())).append('\n');
        sb.append(csv("meta")).append(',').append(csv("days")).append(',').append(csv(report.getDays())).append('\n');
        sb.append(csv("meta")).append(',').append(csv("facilityId")).append(',').append(csv(report.getFacilityId())).append('\n');
        sb.append(csv("meta")).append(',').append(csv("facilityName")).append(',').append(csv(report.getFacilityName())).append('\n');

        StaffReportKpi k = report.getKpi();
        if (k != null) {
            sb.append(csv("kpi")).append(',').append(csv("appointments")).append(',').append(k.getAppointments()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("completed")).append(',').append(k.getCompleted()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("cancelled")).append(',').append(k.getCancelled()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("checkedIn")).append(',').append(k.getCheckedIn()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("pending")).append(',').append(k.getPending()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("confirmed")).append(',').append(k.getConfirmed()).append('\n');
            sb.append(csv("kpi")).append(',').append(csv("completionRate")).append(',').append(k.getCompletionRate()).append('\n');
        }

        sb.append("\n");
        sb.append("daily_date,label,count\n");
        if (report.getDailySeries() != null) {
            for (DailyCountItem d : report.getDailySeries()) {
                sb.append(csv(d.getDate())).append(',').append(csv(d.getLabel())).append(',').append(d.getCount()).append('\n');
            }
        }

        sb.append("\n");
        sb.append("rank,vaccine,shots,pct\n");
        if (report.getVaccineRanking() != null) {
            for (VaccineRankItem v : report.getVaccineRanking()) {
                sb.append(v.getRank()).append(',').append(csv(v.getVaccineName())).append(',')
                        .append(v.getShots()).append(',').append(v.getPct()).append('\n');
            }
        }

        sb.append("\n");
        sb.append("severity,label,count,pct\n");
        if (report.getReactionMix() != null) {
            for (ReactionSeverityItem r : report.getReactionMix()) {
                sb.append(csv(r.getSeverity())).append(',').append(csv(r.getLabel())).append(',')
                        .append(r.getCount()).append(',').append(r.getPct()).append('\n');
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ===================== range / scope =====================

    private record LocalDateRange(LocalDate from, LocalDate to) {}

    private record ResolvedScope(Long facilityId, String facilityName) {}

    private LocalDateRange resolveRange(Integer days, LocalDate fromDateParam, LocalDate toDateParam) {
        LocalDate toDate;
        LocalDate fromDate;

        if (fromDateParam != null || toDateParam != null) {
            toDate = toDateParam != null ? toDateParam : LocalDate.now();
            fromDate = fromDateParam != null ? fromDateParam : toDate.minusDays(29);
        } else if (days != null) {
            if (days < 1 || days > MAX_RANGE_DAYS) {
                throw new BadRequestException("days phải từ 1 đến " + MAX_RANGE_DAYS);
            }
            toDate = LocalDate.now();
            fromDate = toDate.minusDays(days - 1L);
        } else {
            toDate = LocalDate.now();
            fromDate = toDate.minusDays(29);
        }

        if (fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate không được sau toDate");
        }
        long span = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        if (span > MAX_RANGE_DAYS) {
            throw new BadRequestException("Khoảng ngày tối đa " + MAX_RANGE_DAYS + " ngày");
        }
        return new LocalDateRange(fromDate, toDate);
    }

    private ResolvedScope resolveScope(Account account, Long requestedFacilityId) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = account.getMedicalStaff();
            if (staff == null || staff.getFacility() == null) {
                throw new BadRequestException("Tài khoản nhân viên y tế này chưa được gán cơ sở tiêm chủng!");
            }
            return new ResolvedScope(staff.getFacility().getFacilityId(), staff.getFacility().getFacilityName());
        }
        return new ResolvedScope(requestedFacilityId, null);
    }

    private Account findAccount(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
    }

    // ===================== builders =====================

    private List<DailyCountItem> buildDailySeries(List<Object[]> rows, LocalDate from, LocalDate to) {
        Map<LocalDate, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((LocalDate) row[0], (Long) row[1]);
        }
        long max = map.values().stream().mapToLong(Long::longValue).max().orElse(1L);
        if (max < 1) max = 1;
        LocalDate today = LocalDate.now();
        List<DailyCountItem> list = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            long count = map.getOrDefault(d, 0L);
            list.add(DailyCountItem.builder()
                    .date(d)
                    .label(toWeekdayLabel(d))
                    .count(count)
                    .barHeight((int) Math.round(count * 100.0 / max))
                    .today(d.equals(today))
                    .build());
        }
        return list;
    }

    private String toWeekdayLabel(LocalDate d) {
        return switch (d.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private List<VaccineRankItem> buildVaccineRanking(List<Object[]> rows) {
        long total = rows.stream().mapToLong(r -> (Long) r[2]).sum();
        if (total < 1) total = 1;
        List<VaccineRankItem> list = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            if (rank > 10) break;
            long shots = (Long) row[2];
            double pct = Math.round(shots * 1000.0 / total) / 10.0;
            String tag = rank == 1 ? "info" : rank <= 3 ? "ok" : "";
            list.add(VaccineRankItem.builder()
                    .rank(rank)
                    .vaccineId((Long) row[0])
                    .vaccineName((String) row[1])
                    .shots(shots)
                    .pct(pct)
                    .tag(tag)
                    .build());
            rank++;
        }
        return list;
    }

    private List<ReactionSeverityItem> buildReactionMix(List<Object[]> rows) {
        Map<ReactionSeverity, Long> map = new EnumMap<>(ReactionSeverity.class);
        for (ReactionSeverity s : ReactionSeverity.values()) {
            map.put(s, 0L);
        }
        for (Object[] row : rows) {
            map.put((ReactionSeverity) row[0], (Long) row[1]);
        }
        long total = map.values().stream().mapToLong(Long::longValue).sum();
        if (total < 1) total = 1;
        List<ReactionSeverityItem> list = new ArrayList<>();
        for (ReactionSeverity s : List.of(
                ReactionSeverity.NONE, ReactionSeverity.MILD,
                ReactionSeverity.MODERATE, ReactionSeverity.SEVERE)) {
            long c = map.getOrDefault(s, 0L);
            list.add(ReactionSeverityItem.builder()
                    .severity(s.name())
                    .label(severityLabel(s))
                    .count(c)
                    .pct(Math.round(c * 1000.0 / total) / 10.0)
                    .build());
        }
        return list;
    }

    private String severityLabel(ReactionSeverity s) {
        return switch (s) {
            case NONE -> "Không có / Tự khỏi";
            case MILD -> "Nhẹ";
            case MODERATE -> "Trung bình";
            case SEVERE -> "Nặng";
        };
    }

    private List<TimeSlotLoadItem> buildOverload(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) return List.of();
        long max = rows.stream().mapToLong(r -> (Long) r[1]).max().orElse(1L);
        if (max < 1) max = 1;
        List<TimeSlotLoadItem> list = new ArrayList<>();
        for (Object[] row : rows) {
            LocalTime t = (LocalTime) row[0];
            long count = (Long) row[1];
            int pct = (int) Math.round(count * 100.0 / max);
            String level = pct >= 75 ? "high" : pct >= 45 ? "mid" : "low";
            list.add(TimeSlotLoadItem.builder()
                    .time(t.toString().substring(0, 5))
                    .count(count)
                    .pct(pct)
                    .level(level)
                    .build());
        }
        return list;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String csv(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}