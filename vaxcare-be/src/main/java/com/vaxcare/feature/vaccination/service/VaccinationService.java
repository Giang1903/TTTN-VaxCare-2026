package com.vaxcare.feature.vaccination.service;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import com.vaxcare.feature.inventory.service.InventoryService;
import com.vaxcare.feature.notification.service.VaccinationReminderService;
import com.vaxcare.feature.vaccination.dto.RecordVaccinationRequest;
import com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse;
import com.vaxcare.feature.vaccination.dto.VaccinationHistoryResponse;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.feature.vaccination.repository.VaccinationHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VaccinationService {

    // Chỉ trừ kho khi mũi tiêm thực sự được đưa vào người (SUCCESS). FAILED (vd: hoãn tiêm vì
    // phản ứng bất thường/chống chỉ định phát hiện tại chỗ) thì không trừ kho.
    private static final Set<VaccinationResult> STOCK_DEDUCTING_RESULTS =
            Set.of(VaccinationResult.SUCCESS);

    private final AppointmentRepository appointmentRepository;
    private final AccountRepository accountRepository;
    private final VaccinationHistoryRepository historyRepository;
    private final VaccinationDetailRepository detailRepository;
    private final InventoryService inventoryService;
    private final VaccinationReminderService reminderService;

    // ===================== GHI NHẬN KẾT QUẢ TIÊM (STAFF) =====================

    @Transactional
    public VaccinationDetailResponse recordVaccination(RecordVaccinationRequest request, Long currentAccountId) {
        Account account = findAccountOrThrow(currentAccountId);
        Appointment appointment = findAppointmentOrThrow(request.getAppointmentId());
        checkFacilityScope(account, appointment);

        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException(
                    "Chỉ có thể ghi nhận kết quả tiêm cho lịch hẹn đang ở trạng thái CHECKED_IN (hiện tại: "
                            + appointment.getStatus() + ")");
        }
        if (detailRepository.existsByAppointment_AppointmentId(appointment.getAppointmentId())) {
            throw new BadRequestException("Lịch hẹn này đã được ghi nhận kết quả tiêm trước đó");
        }

        User user = appointment.getUser();
        Long vaccineId = appointment.getVaccine().getVaccineId();

        VaccinationHistory history = historyRepository.findByUser_UserId(user.getUserId())
                .orElseGet(() -> historyRepository.save(VaccinationHistory.builder().user(user).build()));

        VaccinationResult result = request.getResult() != null ? request.getResult() : VaccinationResult.SUCCESS;

        int doseNumber = request.getDoseNumber() != null
                ? request.getDoseNumber()
                : (int) detailRepository.countByHistory_HistoryIdAndVaccine_VaccineIdAndResultNot(
                        history.getHistoryId(), vaccineId, VaccinationResult.FAILED) + 1;

        // Nếu không đủ tồn kho, deductStockForVaccination ném BadRequestException -> @Transactional
        // rollback toàn bộ (không tạo VaccinationDetail, không đổi trạng thái lịch hẹn).
        VaccineBatch batch = STOCK_DEDUCTING_RESULTS.contains(result)
                ? inventoryService.deductStockForVaccination(appointment.getFacility().getFacilityId(), vaccineId, 1)
                : null;

        String certificateCode = result == VaccinationResult.SUCCESS ? generateCertificateCode() : null;

        VaccinationDetail detail = VaccinationDetail.builder()
                .history(history)
                .appointment(appointment)
                .vaccine(appointment.getVaccine())
                .batch(batch)
                .staff(resolveStaff(account))
                .doseNumber(doseNumber)
                .injectionDate(request.getInjectionDate() != null ? request.getInjectionDate() : LocalDate.now())
                .result(result)
                .note(request.getNote())
                .certificateCode(certificateCode)
                .build();

        detail = detailRepository.save(detail);

        // Đồng bộ ghi chú → lịch hẹn (staff drawer + user đều thấy cùng nội dung)
        String noteSync = request.getNote() != null ? request.getNote().trim() : null;
        if (noteSync != null && noteSync.isEmpty()) {
            noteSync = null;
        }
        if (noteSync != null) {
            appointment.setNote(noteSync);
        }

        if (STOCK_DEDUCTING_RESULTS.contains(result)) {
            // Chỉ tính/nhắc mũi tiếp theo khi mũi này thực sự được tiêm (SUCCESS)
            reminderService.createNextDoseNotificationIfApplicable(detail);
            // Hệ thống chủ động gửi khảo sát / theo dõi sau tiêm (24–72h)
            try {
                reminderService.notifyPostVaccinationSurvey(detail);
            } catch (Exception ex) {
                // không làm fail ghi nhận tiêm nếu mail/notification lỗi
            }
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        assignStaffIfPossible(account, appointment);
        appointmentRepository.save(appointment);

        return mapToResponse(detail);
    }

    // ===================== TRA CỨU LỊCH SỬ TIÊM CHỦNG =====================

    @Transactional(readOnly = true)
    public VaccinationHistoryResponse getHistoryByUserId(Long userId, Long currentAccountId) {
        Account currentAccount = findAccountOrThrow(currentAccountId);

        // USER chỉ được xem lịch sử của chính mình. MEDICAL_STAFF/ADMIN xem được của bất kỳ ai
        // (phục vụ tra cứu trước khi tiêm và xử lý phản ứng sau tiêm).
        if (currentAccount.getRole() == Role.USER && !userId.equals(currentAccountId)) {
            throw new UnauthorizedException("Bạn chỉ được xem lịch sử tiêm chủng của chính mình!");
        }

        VaccinationHistory history = historyRepository.findByUser_UserId(userId).orElse(null);
        if (history == null) {
            // Người dùng chưa từng tiêm mũi nào trên hệ thống -> trả về lịch sử rỗng thay vì lỗi 404
            Account ownerAccount = findAccountOrThrow(userId);
            String fullName = ownerAccount.getUser() != null ? ownerAccount.getUser().getFullName() : null;
            return VaccinationHistoryResponse.builder()
                    .userId(userId)
                    .userFullName(fullName)
                    .totalDoses(0)
                    .details(List.of())
                    .build();
        }

        List<VaccinationDetail> details = detailRepository.findAllByHistoryIdWithDetails(history.getHistoryId());

        return VaccinationHistoryResponse.builder()
                .historyId(history.getHistoryId())
                .userId(userId)
                .userFullName(history.getUser().getFullName())
                .totalDoses((int) details.stream()
                        .filter(d -> d.getResult() == VaccinationResult.SUCCESS)
                        .count())
                .details(details.stream().map(this::mapToResponse).toList())
                .build();
    }

    // ===================== HELPERS =====================

    private String generateCertificateCode() {
        return "VXC-CERT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 16);
    }

    private MedicalStaff resolveStaff(Account account) {
        return account.getRole() == Role.MEDICAL_STAFF ? account.getMedicalStaff() : null;
    }

    private void assignStaffIfPossible(Account account, Appointment appointment) {
        if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            appointment.setStaff(account.getMedicalStaff());
        }
    }

    private void checkFacilityScope(Account account, Appointment appointment) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            if (!staff.getFacility().getFacilityId().equals(appointment.getFacility().getFacilityId())) {
                throw new UnauthorizedException("Bạn chỉ được ghi nhận kết quả tiêm cho lịch hẹn thuộc cơ sở tiêm chủng của mình!");
            }
        }
        // ADMIN: không giới hạn theo cơ sở
    }

    private MedicalStaff requireStaffProfile(Account account) {
        if (account.getMedicalStaff() == null || account.getMedicalStaff().getFacility() == null) {
            throw new BadRequestException("Tài khoản nhân viên y tế này chưa được gán cơ sở tiêm chủng!");
        }
        return account.getMedicalStaff();
    }

    private Account findAccountOrThrow(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
    }

    private Appointment findAppointmentOrThrow(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn có ID: " + appointmentId));
    }


    /** Luôn lấy required_doses từ bảng vaccines; tối thiểu 1. */
    private int resolveRequiredDoses(VaccinationDetail detail) {
        if (detail.getVaccine() == null) {
            return 1;
        }
        Integer rd = detail.getVaccine().getRequiredDoses();
        return (rd != null && rd > 0) ? rd : 1;
    }


    /**
     * Ghi chú hiển thị cho user: ưu tiên note lúc ghi nhận tiêm,
     * nếu trống thì lấy ghi chú staff trên lịch hẹn (appointment.note).
     */
    private String resolveDisplayNote(VaccinationDetail detail) {
        if (detail.getNote() != null && !detail.getNote().isBlank()) {
            return detail.getNote().trim();
        }
        if (detail.getAppointment() != null
                && detail.getAppointment().getNote() != null
                && !detail.getAppointment().getNote().isBlank()) {
            return detail.getAppointment().getNote().trim();
        }
        return null;
    }

    private VaccinationDetailResponse mapToResponse(VaccinationDetail detail) {
        Appointment appointment = detail.getAppointment();
        return VaccinationDetailResponse.builder()
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
                .requiredDoses(resolveRequiredDoses(detail))
                .injectionDate(detail.getInjectionDate())
                .result(detail.getResult())
                .note(resolveDisplayNote(detail))
                .certificateCode(detail.getCertificateCode())
                .createdAt(detail.getCreatedAt())
                .build();
    }
}