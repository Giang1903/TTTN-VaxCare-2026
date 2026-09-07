package com.vaxcare.feature.appointment.service;

import com.vaxcare.utils.QRCodeUtil;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.vaccination.dto.RecordVaccinationRequest;
import com.vaxcare.feature.vaccination.service.VaccinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StaffAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final AppointmentService appointmentService;
    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final VaccinationService vaccinationService;

    @Transactional(readOnly = true)
    public List<AppointmentResponse> searchAppointments(Long currentAccountId, Long facilityId,
                                                          LocalDate date, AppointmentStatus status, String keyword,
                                                          boolean paidOnly) {
        Account account = findAccountOrThrow(currentAccountId);
        Long effectiveFacilityId = resolveEffectiveFacilityId(account, facilityId);
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        return appointmentRepository.searchForStaff(effectiveFacilityId, date, status, normalizedKeyword).stream()
                .map(a -> {
                    appointmentService.expireIfPastSlot(a, now);
                    return appointmentService.mapToResponse(a);
                })
                .filter(r -> {
                    if (!paidOnly) return true;
                    boolean paid = Boolean.TRUE.equals(r.getPaid());
                    boolean cancelled = r.getStatus() == AppointmentStatus.CANCELLED;
                    return paid || cancelled;
                })
                .toList();
    }

    @Transactional
    public AppointmentResponse confirmAppointment(Long appointmentId, Long currentAccountId) {
        Account account = findAccountOrThrow(currentAccountId);
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkFacilityScope(account, appointment);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException(
                    "Chỉ có thể xác nhận lịch hẹn đang ở trạng thái PENDING (hiện tại: " + appointment.getStatus() + ")");
        }

        assertPaidOrFree(appointment);

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        if (appointment.getQrCode() == null || appointment.getQrCode().isBlank()) {
            appointment.setQrCode(QRCodeUtil.generateToken());
        }
        assignStaffIfPossible(account, appointment);

        return appointmentService.mapToResponse(appointmentRepository.save(appointment));
    }

    

    // ===================== CHECK-IN BẰNG QR CODE =====================

    /** Độ dài khung giờ tiêm (phút) — khớp AppointmentService.SLOT_DURATION_MINUTES */
    private static final int SLOT_DURATION_MINUTES = 30;

    @Transactional
    public AppointmentResponse checkin(String qrCode, Long currentAccountId) {
        Account account = findAccountOrThrow(currentAccountId);
        Appointment appointment = appointmentRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new BadRequestException("Mã QR không hợp lệ hoặc không tồn tại"));

        checkFacilityScope(account, appointment);

        if (appointment.getStatus() == AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException("Lịch hẹn này đã được check-in trước đó");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new BadRequestException("Lịch hẹn này đã bị hủy / không đến, không thể check-in");
        }
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException(
                    "Chỉ có thể check-in lịch hẹn đang ở trạng thái CONFIRMED (hiện tại: "
                            + appointment.getStatus() + ")");
        }

        assertPaidOrFree(appointment);
        assertCheckinTimeWindow(appointment);

        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        assignStaffIfPossible(account, appointment);

        return appointmentService.mapToResponse(appointmentRepository.save(appointment));
    }

    /**
     * Cho phép check-in trước tối đa 15 phút đến hết khung [giờ hẹn + SLOT_DURATION] của đúng ngày hẹn.
     */
    private void assertCheckinTimeWindow(Appointment appointment) {
        LocalDate apptDate = appointment.getAppointmentDate();
        var timeSlot = appointment.getTimeSlot();
        if (apptDate == null || timeSlot == null) {
            throw new BadRequestException("Lịch hẹn thiếu ngày hoặc khung giờ");
        }

        LocalDateTime slotStart = LocalDateTime.of(apptDate, timeSlot);
        LocalDateTime earliestCheckin = slotStart.minusMinutes(15);
        LocalDateTime slotEnd = slotStart.plusMinutes(SLOT_DURATION_MINUTES);
        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(earliestCheckin)) {
            throw new BadRequestException(
                    "Chưa đến khung giờ check-in. Chỉ được check-in từ "
                            + timeSlot.minusMinutes(15) + " (trước giờ tiêm 15 phút) ngày " + apptDate
                            + " (hiện tại: " + now.toLocalTime().withNano(0) + ")");
        }
        if (!now.isBefore(slotEnd)) {
            throw new BadRequestException(
                    "Đã quá khung giờ tiêm (" + timeSlot + "–"
                            + slotEnd.toLocalTime().withNano(0) + " ngày " + apptDate
                            + "). Lịch sẽ được hệ thống hủy tự động nếu chưa check-in.");
        }
    }

    // ===================== HOÀN TẤT TIÊM CHỦNG (TRỪ KHO TỰ ĐỘNG) =====================
    @Transactional
    public AppointmentResponse completeVaccination(Long appointmentId, Long currentAccountId) {
        vaccinationService.recordVaccination(
                RecordVaccinationRequest.builder()
                        .appointmentId(appointmentId)
                        .build(),
                currentAccountId);

        return appointmentService.mapToResponse(findAppointmentOrThrow(appointmentId));
    }

    /**
     * Cập nhật ghi chú nhân viên trên lịch hẹn (không đổi trạng thái).
     */
    @Transactional
    public AppointmentResponse updateNote(Long appointmentId, String note, Long currentAccountId) {
        Account account = findAccountOrThrow(currentAccountId);
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkFacilityScope(account, appointment);

        String normalized = note == null ? null : note.trim();
        if (normalized != null && normalized.isEmpty()) {
            normalized = null;
        }
        if (normalized != null && normalized.length() > 2000) {
            throw new BadRequestException("Ghi chú không được vượt quá 2000 ký tự");
        }

        appointment.setNote(normalized);
        assignStaffIfPossible(account, appointment);
        Appointment saved = appointmentRepository.save(appointment);
        final String noteForDetail = normalized;
        vaccinationDetailRepository.findFirstByAppointment_AppointmentIdOrderByDetailIdDesc(appointmentId)
                .ifPresent(detail -> {
                    detail.setNote(noteForDetail);
                    vaccinationDetailRepository.save(detail);
                });

        return appointmentService.mapToResponse(saved);
    }

    // ===================== HELPERS =====================

    private Long resolveEffectiveFacilityId(Account account, Long requestedFacilityId) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            return staff.getFacility().getFacilityId();
        }
        return requestedFacilityId; 
    }

    private void checkFacilityScope(Account account, Appointment appointment) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            if (!staff.getFacility().getFacilityId().equals(appointment.getFacility().getFacilityId())) {
                throw new UnauthorizedException("Bạn chỉ được quản lý lịch hẹn thuộc cơ sở tiêm chủng của mình!");
            }
        }
    }


    /**
     * Phải thanh toán SUCCESS (hoặc giá 0 = miễn phí / free rebook) mới confirm / check-in / tiêm.
     */
    private void assertPaidOrFree(Appointment appointment) {
        java.math.BigDecimal price = appointment.getPrice();
        boolean free = price == null || price.compareTo(java.math.BigDecimal.ZERO) == 0;
        if (free) {
            return;
        }
        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointment.getAppointmentId())
                .orElse(null);
        boolean paid = payment != null && payment.getStatus() == PaymentStatus.SUCCESS;
        if (!paid) {
            String payState = payment == null ? "chưa có giao dịch" : String.valueOf(payment.getStatus());
            throw new BadRequestException(
                    "Lịch hẹn chưa thanh toán thành công (" + payState + "). "
                            + "Yêu cầu khách thanh toán trước khi xác nhận / check-in / ghi nhận tiêm.");
        }
    }

    private void assignStaffIfPossible(Account account, Appointment appointment) {
        if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            appointment.setStaff(account.getMedicalStaff());
        }
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
}