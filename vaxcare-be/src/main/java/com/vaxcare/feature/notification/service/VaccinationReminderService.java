package com.vaxcare.feature.notification.service;

import com.vaxcare.common.enums.NotificationType;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VaccinationReminderService {

    private static final int REMINDER_LEAD_DAYS = 3;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final VaccinationDetailRepository detailRepository;
    private final VaccinationProtocolRepository protocolRepository;
    private final ProtocolDetailRepository protocolDetailRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

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

    // ===================== CRONJOB NHẮC LỊCH QUA EMAIL =====================

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendDueReminders() {
        LocalDate today = LocalDate.now();
        LocalDate targetReminderDate = today.plusDays(REMINDER_LEAD_DAYS);
        List<VaccinationDetail> latestDetails = detailRepository.findLatestSuccessDetailPerUserAndVaccine();
        Map<Long, List<ProtocolDetail>> protocolDetailsByVaccineId = protocolDetailRepository
                .findAllWithProtocolAndVaccine().stream()
                .collect(Collectors.groupingBy(pd -> pd.getProtocol().getVaccine().getVaccineId()));

        int sentCount = 0;

        for (VaccinationDetail detail : latestDetails) {
            Vaccine vaccine = detail.getVaccine();
            Optional<LocalDate> nextDoseDateOpt =
                    calculateNextDoseDate(vaccine, detail.getDoseNumber(), detail.getInjectionDate(), protocolDetailsByVaccineId);

            if (nextDoseDateOpt.isEmpty() || !nextDoseDateOpt.get().isEqual(targetReminderDate)) {
                continue;
            }

            var account = detail.getHistory().getUser().getAccount();

            if (notificationService.alreadyNotified(account.getAccountId(), detail.getDetailId(), NotificationType.REMINDER)) {
                continue;
            }

            emailService.sendNextDoseReminderEmail(
                    account.getEmail(),
                    detail.getHistory().getUser().getFullName(),
                    vaccine.getVaccineName(),
                    detail.getDoseNumber() + 1,
                    nextDoseDateOpt.get());

            notificationService.create(
                    account,
                    "Nhắc lịch tiêm sắp tới",
                    "Còn " + REMINDER_LEAD_DAYS + " ngày nữa đến hạn tiêm mũi " + (detail.getDoseNumber() + 1)
                            + " vắc xin " + vaccine.getVaccineName() + " (dự kiến "
                            + nextDoseDateOpt.get().format(DATE_FMT) + "). VaxCare đã gửi email nhắc lịch cho bạn.",
                    NotificationType.REMINDER,
                    detail.getDetailId());

            sentCount++;
        }

        log.info("[CronJob] Đã gửi {} email nhắc lịch tiêm cho ngày {}", sentCount, today);
    }
}
