package com.vaxcare.feature.appointment.service;

import com.vaxcare.utils.QRCodeUtil;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
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
    private final AccountRepository accountRepository;
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;

    @Transactional(readOnly = true)
    public List<AppointmentResponse> searchAppointments(Long currentAccountId, Long facilityId,
                                                          LocalDate date, AppointmentStatus status, String keyword) {
        Account account = findAccountOrThrow(currentAccountId);
        Long effectiveFacilityId = resolveEffectiveFacilityId(account, facilityId);
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        return appointmentRepository.searchForStaff(effectiveFacilityId, date, status, normalizedKeyword).stream()
                .map(appointmentService::mapToResponse)
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

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        // Lịch miễn phí / confirm bởi staff: sinh QR nếu chưa có (QR chuẩn sau thanh toán VNPay)
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

    /**
     * Endpoint "hoàn tất nhanh" (không cần Staff nhập chi tiết dose_number/kết quả/ghi chú).
     * Từ 29/08: ủy quyền toàn bộ nghiệp vụ (trừ kho FEFO, tạo VaccinationHistory/VaccinationDetail,
     * sinh certificate_code, chuyển appointment sang COMPLETED) cho VaccinationService, tránh trùng lặp
     * logic với POST /api/v1/vaccinations/record - vốn cho phép nhập chi tiết đầy đủ hơn.
     */
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
        return appointmentService.mapToResponse(appointmentRepository.save(appointment));
    }

    // ===================== HELPERS =====================

    private Long resolveEffectiveFacilityId(Account account, Long requestedFacilityId) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            return staff.getFacility().getFacilityId();
        }
        return requestedFacilityId; // ADMIN: null = xem tất cả cơ sở
    }

    private void checkFacilityScope(Account account, Appointment appointment) {
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            if (!staff.getFacility().getFacilityId().equals(appointment.getFacility().getFacilityId())) {
                throw new UnauthorizedException("Bạn chỉ được quản lý lịch hẹn thuộc cơ sở tiêm chủng của mình!");
            }
        }
        // ADMIN: không giới hạn theo cơ sở
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