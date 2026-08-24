package com.vaxcare.feature.appointment.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.dto.AppointmentRequest;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.AppointmentSlotResponse;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.dto.QrCodeResponse;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.vaccine.entity.PriceList;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.PriceListRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import com.vaxcare.feature.notification.service.EmailService;
import com.vaxcare.utils.QRCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AppointmentService {

    private static final int SLOT_DURATION_MINUTES = 30;

    private static final Set<AppointmentStatus> ACTIVE_STATUSES =
            Set.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN);

    private final AppointmentRepository appointmentRepository;
    private final AccountRepository accountRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineRepository vaccineRepository;
    private final PriceListRepository priceListRepository;
    private final EmailService emailService;

    // ===================== KHUNG GIỜ TRỐNG =====================

    @Transactional(readOnly = true)
    public List<AppointmentSlotResponse> getAvailableSlots(Long facilityId, LocalDate date) {
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Ngày tra cứu không được ở trong quá khứ");
        }

        VaccinationFacility facility = findFacilityOrThrow(facilityId);
        if (facility.getStatus() != ActiveStatus.ACTIVE) {
            throw new BadRequestException("Cơ sở tiêm chủng hiện không hoạt động");
        }
        if (facility.getOpeningTime() == null || facility.getClosingTime() == null
                || facility.getCapacityPerSlot() == null) {
            throw new BadRequestException("Cơ sở tiêm chủng chưa cấu hình đầy đủ giờ làm việc / sức chứa");
        }

        List<AppointmentSlotResponse> slots = new ArrayList<>();
        LocalTime cursor = facility.getOpeningTime();
        LocalTime now = LocalTime.now();
        boolean isToday = date.isEqual(LocalDate.now());

        while (cursor.isBefore(facility.getClosingTime())) {
            // Bỏ qua các khung giờ đã trôi qua nếu đang tra cứu cho hôm nay
            if (!isToday || cursor.isAfter(now)) {
                long booked = appointmentRepository.countBookingsInSlot(facilityId, date, cursor);
                int capacity = facility.getCapacityPerSlot();
                int available = (int) Math.max(0, capacity - booked);

                slots.add(AppointmentSlotResponse.builder()
                        .timeSlot(cursor)
                        .capacity(capacity)
                        .bookedCount((int) booked)
                        .availableCount(available)
                        .full(available <= 0)
                        .build());
            }
            cursor = cursor.plusMinutes(SLOT_DURATION_MINUTES);
        }

        return slots;
    }

    // ===================== ĐẶT / XEM LỊCH HẸN =====================

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long currentUserId) {
        User user = resolveUser(currentUserId);
        return appointmentRepository.findByUserIdWithDetails(user.getUserId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long appointmentId, Long currentUserId) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);
        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public QrCodeResponse getQrCode(Long appointmentId, Long currentUserId) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);

        if (appointment.getQrCode() == null) {
            throw new BadRequestException(
                    "Lịch hẹn này chưa có mã QR. Mã QR chỉ được sinh ra sau khi thanh toán thành công");
        }

        return QrCodeResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                .qrCodeToken(appointment.getQrCode())
                .qrCodeImageBase64(QRCodeUtil.generateQRCodeBase64(appointment.getQrCode()))
                .build();
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long currentUserId, AppointmentRequest request) {
        if (request.getFacilityId() == null) {
            throw new BadRequestException("Cơ sở tiêm không được để trống");
        }
        if (request.getVaccineId() == null) {
            throw new BadRequestException("Vắc xin không được để trống");
        }
        if (request.getAppointmentDate() == null) {
            throw new BadRequestException("Ngày hẹn không được để trống");
        }
        if (request.getTimeSlot() == null) {
            throw new BadRequestException("Khung giờ không được để trống");
        }

        User user = resolveUser(currentUserId);

        VaccinationFacility facility = findFacilityOrThrow(request.getFacilityId());
        Vaccine vaccine = findVaccineOrThrow(request.getVaccineId());

        validateFacilityAndVaccineActive(facility, vaccine);
        validateSlotWithinWorkingHours(facility, request.getAppointmentDate(), request.getTimeSlot());
        ensureSlotHasCapacity(facility, request.getAppointmentDate(), request.getTimeSlot(), null);

        // Mã QR / mã lịch đơn giản để check-in và gửi email
        String qrCode = "VX-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        Appointment appointment = Appointment.builder()
                .user(user)
                .facility(facility)
                .vaccine(vaccine)
                .price(resolveCurrentPrice(vaccine.getVaccineId(), facility.getFacilityId()))
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(request.getTimeSlot())
                .status(AppointmentStatus.PENDING)
                .qrCode(qrCode)
                .note(request.getNote())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Gửi email xác nhận — không làm fail đặt lịch nếu mail lỗi
        try {
            String email = user.getAccount() != null ? user.getAccount().getEmail() : null;
            emailService.sendAppointmentConfirmationEmail(
                    email,
                    user.getFullName(),
                    saved.getAppointmentId(),
                    vaccine.getVaccineName(),
                    facility.getFacilityName(),
                    facility.getAddress(),
                    saved.getAppointmentDate(),
                    saved.getTimeSlot(),
                    saved.getPrice(),
                    saved.getQrCode()
            );
        } catch (Exception ignored) {
            // đã log trong EmailService
        }

        return mapToResponse(saved);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, Long currentUserId, AppointmentRequest request) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);
        ensureModifiable(appointment, "đổi lịch hẹn");

        VaccinationFacility facility = request.getFacilityId() != null
                ? findFacilityOrThrow(request.getFacilityId())
                : appointment.getFacility();
        Vaccine vaccine = request.getVaccineId() != null
                ? findVaccineOrThrow(request.getVaccineId())
                : appointment.getVaccine();
        LocalDate newDate = request.getAppointmentDate() != null
                ? request.getAppointmentDate()
                : appointment.getAppointmentDate();
        LocalTime newTimeSlot = request.getTimeSlot() != null
                ? request.getTimeSlot()
                : appointment.getTimeSlot();

        validateFacilityAndVaccineActive(facility, vaccine);
        validateSlotWithinWorkingHours(facility, newDate, newTimeSlot);

        boolean slotUnchanged = facility.getFacilityId().equals(appointment.getFacility().getFacilityId())
                && newDate.isEqual(appointment.getAppointmentDate())
                && newTimeSlot.equals(appointment.getTimeSlot());

        if (!slotUnchanged) {
            ensureSlotHasCapacity(facility, newDate, newTimeSlot, null);
        }

        appointment.setFacility(facility);
        appointment.setVaccine(vaccine);
        appointment.setAppointmentDate(newDate);
        appointment.setTimeSlot(newTimeSlot);
        appointment.setPrice(resolveCurrentPrice(vaccine.getVaccineId(), facility.getFacilityId()));
        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }
        // Đổi lịch thì cần Staff xác nhận lại từ đầu
        appointment.setStatus(AppointmentStatus.PENDING);

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long currentUserId, CancelAppointmentRequest request) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);
        ensureModifiable(appointment, "hủy lịch hẹn");

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancellationReason(request != null ? request.getReason() : null);

        return mapToResponse(appointmentRepository.save(appointment));
    }

    // ===================== HELPERS =====================

    private void validateFacilityAndVaccineActive(VaccinationFacility facility, Vaccine vaccine) {
        if (facility.getStatus() != ActiveStatus.ACTIVE) {
            throw new BadRequestException("Cơ sở tiêm chủng hiện không hoạt động");
        }
        if (vaccine.getStatus() != ActiveStatus.ACTIVE) {
            throw new BadRequestException("Vắc xin này hiện không khả dụng");
        }
    }

    private void validateSlotWithinWorkingHours(VaccinationFacility facility, LocalDate date, LocalTime timeSlot) {
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Không thể đặt lịch hẹn trong quá khứ");
        }
        if (date.isEqual(LocalDate.now()) && timeSlot.isBefore(LocalTime.now())) {
            throw new BadRequestException("Khung giờ đã trôi qua trong hôm nay");
        }
        if (facility.getOpeningTime() != null && timeSlot.isBefore(facility.getOpeningTime())) {
            throw new BadRequestException("Khung giờ nằm ngoài giờ mở cửa của cơ sở");
        }
        if (facility.getClosingTime() != null && !timeSlot.isBefore(facility.getClosingTime())) {
            throw new BadRequestException("Khung giờ nằm ngoài giờ mở cửa của cơ sở");
        }
    }

    private void ensureSlotHasCapacity(VaccinationFacility facility, LocalDate date, LocalTime timeSlot, Long excludeAppointmentId) {
        long booked = appointmentRepository.countBookingsInSlot(facility.getFacilityId(), date, timeSlot);
        int capacity = facility.getCapacityPerSlot() != null ? facility.getCapacityPerSlot() : 0;
        if (booked >= capacity) {
            throw new BadRequestException("Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác");
        }
    }

    private void ensureModifiable(Appointment appointment, String action) {
        if (!ACTIVE_STATUSES.contains(appointment.getStatus())) {
            throw new BadRequestException(
                    "Không thể " + action + " vì lịch hẹn đang ở trạng thái " + appointment.getStatus());
        }
        if (appointment.getStatus() == AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException("Lịch hẹn đã check-in, không thể " + action);
        }
    }

    private void checkOwnership(Appointment appointment, Long currentUserId) {
        Account account = accountRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentUserId));

        boolean isOwner = appointment.getUser().getUserId().equals(currentUserId);
        boolean isStaffOrAdmin = !account.getRole().name().equals("USER");

        if (!isOwner && !isStaffOrAdmin) {
            throw new UnauthorizedException("Bạn không có quyền thao tác trên lịch hẹn này!");
        }
    }

    private User resolveUser(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
        if (account.getUser() == null) {
            throw new BadRequestException("Tài khoản này không phải tài khoản khách hàng để đặt lịch hẹn!");
        }
        return account.getUser();
    }

    private VaccinationFacility findFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở tiêm chủng có ID: " + facilityId));
    }

    private Vaccine findVaccineOrThrow(Long vaccineId) {
        return vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId));
    }

    private Appointment findAppointmentOrThrow(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn có ID: " + appointmentId));
    }

    private BigDecimal resolveCurrentPrice(Long vaccineId, Long facilityId) {
        List<PriceList> prices = priceListRepository.findActivePrices(vaccineId, facilityId, LocalDate.now());
        return prices.stream().findFirst().map(PriceList::getPrice).orElse(null);
    }

    public AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                .userId(appointment.getUser().getUserId())
                .userFullName(appointment.getUser().getFullName())
                .userPhone(appointment.getUser().getAccount() != null ? appointment.getUser().getAccount().getPhone() : null)
                .facilityId(appointment.getFacility().getFacilityId())
                .facilityName(appointment.getFacility().getFacilityName())
                .vaccineId(appointment.getVaccine().getVaccineId())
                .vaccineName(appointment.getVaccine().getVaccineName())
                .staffId(appointment.getStaff() != null ? appointment.getStaff().getStaffId() : null)
                .staffName(appointment.getStaff() != null ? appointment.getStaff().getFullName() : null)
                .price(appointment.getPrice())
                .recommendedByAi(appointment.getRecommendedByAi())
                .appointmentDate(appointment.getAppointmentDate())
                .timeSlot(appointment.getTimeSlot())
                .status(appointment.getStatus())
                .qrCode(appointment.getQrCode())
                .note(appointment.getNote())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}