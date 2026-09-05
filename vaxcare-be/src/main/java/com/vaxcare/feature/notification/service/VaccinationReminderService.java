package com.vaxcare.feature.notification.service;

import com.vaxcare.common.enums.NotificationType;
import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.feature.reaction.repository.ReactionRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.feature.vaccine.entity.ProtocolDetail;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.entity.VaccinationProtocol;
import com.vaxcare.feature.vaccine.repository.ProtocolDetailRepository;
import com.vaxcare.feature.vaccine.repository.VaccinationProtocolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VaccinationReminderService {

    /** Nhắc trước hạn trong cửa sổ [today, today + LEAD] và bắt kịp / quá hạn nếu đã trễ. */
    private static final int REMINDER_LEAD_DAYS = 3;

    /** Khung 24–72h sau tiêm: nhắc khảo sát từ ngày +1 đến +3. */
    private static final int SURVEY_FROM_DAYS_AFTER = 1;
    private static final int SURVEY_TO_DAYS_AFTER = 3;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final VaccinationDetailRepository detailRepository;
    private final VaccinationProtocolRepository protocolRepository;
    private final ProtocolDetailRepository protocolDetailRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ReactionRepository reactionRepository;

    // ===================== PROTOCOL ENGINE =====================

    public Optional<LocalDate> calculateNextDoseDate(Vaccine vaccine, int justAdministeredDoseNumber, LocalDate fromDate) {
        if (vaccine.getRequiredDoses() != null && justAdministeredDoseNumber >= vaccine.getRequiredDoses()) {
            return Optional.empty();
        }

        List<VaccinationProtocol> protocols = protocolRepository.findByVaccine_VaccineId(vaccine.getVaccineId());
        for (VaccinationProtocol protocol : protocols) {
            Optional<ProtocolDetail> nextDetail = protocolDetailRepository
                    .findByProtocol_ProtocolIdOrderByDoseNumberAsc(protocol.getProtocolId()).stream()
                    .filter(pd -> pd.getDoseNumber() != null && pd.getDoseNumber() == justAdministeredDoseNumber + 1)
                    .findFirst();

            if (nextDetail.isPresent()) {
                Integer intervalDays = nextDetail.get().getIntervalDays();
                return Optional.of(fromDate.plusDays(intervalDays != null ? intervalDays : 0));
            }
        }

        if (vaccine.getDoseIntervalDays() != null) {
            return Optional.of(fromDate.plusDays(vaccine.getDoseIntervalDays()));
        }

        return Optional.empty();
    }

    private Optional<LocalDate> calculateNextDoseDate(Vaccine vaccine, int justAdministeredDoseNumber, LocalDate fromDate,
                                                       Map<Long, List<ProtocolDetail>> protocolDetailsByVaccineId) {
        if (vaccine.getRequiredDoses() != null && justAdministeredDoseNumber >= vaccine.getRequiredDoses()) {
            return Optional.empty();
        }

        Optional<ProtocolDetail> nextDetail = protocolDetailsByVaccineId
                .getOrDefault(vaccine.getVaccineId(), List.of()).stream()
                .filter(pd -> pd.getDoseNumber() != null && pd.getDoseNumber() == justAdministeredDoseNumber + 1)
                .findFirst();

        if (nextDetail.isPresent()) {
            Integer intervalDays = nextDetail.get().getIntervalDays();
            return Optional.of(fromDate.plusDays(intervalDays != null ? intervalDays : 0));
        }

        if (vaccine.getDoseIntervalDays() != null) {
            return Optional.of(fromDate.plusDays(vaccine.getDoseIntervalDays()));
        }

        return Optional.empty();
    }

    @Transactional
    public void createNextDoseNotificationIfApplicable(VaccinationDetail detail) {
        Vaccine vaccine = detail.getVaccine();
        calculateNextDoseDate(vaccine, detail.getDoseNumber(), detail.getInjectionDate())
                .ifPresent(nextDoseDate -> {
                    String content = "Mũi tiếp theo của vắc xin " + vaccine.getVaccineName()
                            + " (mũi số " + (detail.getDoseNumber() + 1) + ") dự kiến vào ngày "
                            + nextDoseDate.format(DATE_FMT) + ". Hãy đặt lịch sớm để đảm bảo đúng phác đồ.";

                    notificationService.create(
                            detail.getHistory().getUser().getAccount(),
                            "Lịch tiêm tiếp theo (dự kiến)",
                            content,
                            NotificationType.SYSTEM,
                            detail.getDetailId());
                });
    }

    /**
     * Gửi ngay sau khi ghi nhận tiêm SUCCESS: mời theo dõi sức khỏe 24–72h và khai báo phản ứng trên app.
     * Idempotent theo NotificationType.AFTER_VACCINATION + detailId.
     */
    @Transactional
    public void notifyPostVaccinationSurvey(VaccinationDetail detail) {
        if (detail.getResult() != VaccinationResult.SUCCESS) {
            return;
        }
        var account = detail.getHistory().getUser().getAccount();
        if (account == null) {
            return;
        }
        if (notificationService.alreadyNotified(account.getAccountId(), detail.getDetailId(), NotificationType.AFTER_VACCINATION)) {
            return;
        }

        String vaccineName = detail.getVaccine().getVaccineName();
        String bodyNote = "Trong 24–72 giờ tới, hãy theo dõi sức khỏe. Nếu có triệu chứng bất thường, "
                + "vào VaxCare → Hồ sơ tiêm chủng để khai báo phản ứng sau tiêm.";

        emailService.sendPostVaccinationSurveyEmail(
                account.getEmail(),
                detail.getHistory().getUser().getFullName(),
                vaccineName,
                detail.getDoseNumber(),
                detail.getInjectionDate());

        notificationService.create(
                account,
                "Theo dõi sau tiêm – khai báo phản ứng",
                "Bạn vừa hoàn thành mũi tiêm " + vaccineName + ". " + bodyNote,
                NotificationType.AFTER_VACCINATION,
                detail.getDetailId());
    }

    // ===================== CRON: NHẮC LỊCH + QUÁ HẠN (catch-up) =====================

    /**
     * Mỗi ngày 08:00:
     * - nextDose trong [today - ∞, today + 3] (đã đến cửa sổ nhắc hoặc đã quá hạn)
     * - chưa từng gửi REMINDER cho detail này → gửi 1 lần (nội dung phân nhánh sắp hạn / đến hạn / quá hạn)
     * → bắt kịp nếu miss đúng ngày T-3.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendDueReminders() {
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(REMINDER_LEAD_DAYS);

        List<VaccinationDetail> latestDetails = detailRepository.findLatestSuccessDetailPerUserAndVaccine();
        Map<Long, List<ProtocolDetail>> protocolDetailsByVaccineId = protocolDetailRepository
                .findAllWithProtocolAndVaccine().stream()
                .collect(Collectors.groupingBy(pd -> pd.getProtocol().getVaccine().getVaccineId()));

        int sentCount = 0;
        int overdueCount = 0;

        for (VaccinationDetail detail : latestDetails) {
            Vaccine vaccine = detail.getVaccine();
            Optional<LocalDate> nextDoseDateOpt =
                    calculateNextDoseDate(vaccine, detail.getDoseNumber(), detail.getInjectionDate(), protocolDetailsByVaccineId);

            if (nextDoseDateOpt.isEmpty()) {
                continue;
            }

            LocalDate nextDoseDate = nextDoseDateOpt.get();
            // Ngoài cửa sổ: còn xa hơn LEAD ngày → bỏ qua; đã quá hạn hoặc trong LEAD ngày → xử lý
            if (nextDoseDate.isAfter(windowEnd)) {
                continue;
            }

            var account = detail.getHistory().getUser().getAccount();
            if (account == null) {
                continue;
            }

            if (notificationService.alreadyNotified(account.getAccountId(), detail.getDetailId(), NotificationType.REMINDER)) {
                continue;
            }

            int nextDoseNumber = detail.getDoseNumber() + 1;
            boolean overdue = nextDoseDate.isBefore(today);
            long daysDiff = ChronoUnit.DAYS.between(today, nextDoseDate); // âm nếu quá hạn

            String title;
            String notifContent;
            if (overdue) {
                long daysOverdue = ChronoUnit.DAYS.between(nextDoseDate, today);
                title = "Cảnh báo quá hạn tiêm";
                notifContent = "Bạn đã quá hạn tiêm mũi " + nextDoseNumber + " vắc xin " + vaccine.getVaccineName()
                        + " (dự kiến " + nextDoseDate.format(DATE_FMT) + ", trễ " + daysOverdue
                        + " ngày). Vui lòng đặt lịch sớm.";
                emailService.sendOverdueDoseReminderEmail(
                        account.getEmail(),
                        detail.getHistory().getUser().getFullName(),
                        vaccine.getVaccineName(),
                        nextDoseNumber,
                        nextDoseDate,
                        daysOverdue);
                overdueCount++;
            } else if (nextDoseDate.isEqual(today)) {
                title = "Đến hạn tiêm hôm nay";
                notifContent = "Hôm nay là ngày dự kiến tiêm mũi " + nextDoseNumber + " vắc xin "
                        + vaccine.getVaccineName() + ". Vui lòng đến cơ sở hoặc đặt lịch nếu chưa có lịch hẹn.";
                emailService.sendNextDoseReminderEmail(
                        account.getEmail(),
                        detail.getHistory().getUser().getFullName(),
                        vaccine.getVaccineName(),
                        nextDoseNumber,
                        nextDoseDate);
            } else {
                title = "Nhắc lịch tiêm sắp tới";
                notifContent = "Còn " + daysDiff + " ngày nữa đến hạn tiêm mũi " + nextDoseNumber
                        + " vắc xin " + vaccine.getVaccineName() + " (dự kiến "
                        + nextDoseDate.format(DATE_FMT) + "). VaxCare đã gửi email nhắc lịch cho bạn.";
                emailService.sendNextDoseReminderEmail(
                        account.getEmail(),
                        detail.getHistory().getUser().getFullName(),
                        vaccine.getVaccineName(),
                        nextDoseNumber,
                        nextDoseDate);
            }

            notificationService.create(
                    account,
                    title,
                    notifContent,
                    NotificationType.REMINDER,
                    detail.getDetailId());

            sentCount++;
        }

        log.info("[CronJob] Nhắc lịch tiêm: sent={}, overdue={}, date={}", sentCount, overdueCount, today);
    }

    // ===================== CRON: NHẮC KHẢO SÁT SAU TIÊM (24–72h) =====================

    /**
     * Mỗi ngày 09:00: mũi SUCCESS có injectionDate trong [today-3, today-1],
     * chưa có phản ứng khai báo, chưa gửi AFTER_VACCINATION → gửi nhắc khảo sát.
     * (Lần gửi ngay sau tiêm dùng cùng type → alreadyNotified sẽ chặn trùng nếu đã gửi lúc complete.)
     * Nếu lúc complete chưa gửi được mail, cron này bắt kịp trong cửa sổ 24–72h.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendPostVaccinationSurveyReminders() {
        LocalDate today = LocalDate.now();
        LocalDate fromDate = today.minusDays(SURVEY_TO_DAYS_AFTER);
        LocalDate toDate = today.minusDays(SURVEY_FROM_DAYS_AFTER);

        List<VaccinationDetail> details = detailRepository.findSuccessfulInjectionsBetween(fromDate, toDate);
        int sentCount = 0;

        for (VaccinationDetail detail : details) {
            if (reactionRepository.existsByDetail_DetailId(detail.getDetailId())) {
                continue; // đã khai báo phản ứng
            }

            var account = detail.getHistory().getUser().getAccount();
            if (account == null) {
                continue;
            }
            if (notificationService.alreadyNotified(
                    account.getAccountId(), detail.getDetailId(), NotificationType.AFTER_VACCINATION)) {
                continue;
            }

            emailService.sendPostVaccinationSurveyEmail(
                    account.getEmail(),
                    detail.getHistory().getUser().getFullName(),
                    detail.getVaccine().getVaccineName(),
                    detail.getDoseNumber(),
                    detail.getInjectionDate());

            notificationService.create(
                    account,
                    "Nhắc khai báo phản ứng sau tiêm",
                    "Bạn đã tiêm " + detail.getVaccine().getVaccineName() + " vào ngày "
                            + detail.getInjectionDate().format(DATE_FMT)
                            + ". Trong khung 24–72 giờ, hãy vào app khai báo tình trạng sức khỏe nếu có triệu chứng.",
                    NotificationType.AFTER_VACCINATION,
                    detail.getDetailId());

            sentCount++;
        }

        log.info("[CronJob] Nhắc khảo sát sau tiêm: sent={}, window={}..{}", sentCount, fromDate, toDate);
    }
}