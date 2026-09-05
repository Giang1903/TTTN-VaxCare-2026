package com.vaxcare.feature.appointment.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.dto.AppointmentRequest;
import com.vaxcare.feature.appointment.dto.AppointmentResponse;
import com.vaxcare.feature.appointment.dto.AppointmentSlotResponse;
import com.vaxcare.feature.appointment.dto.QrCodeResponse;
import com.vaxcare.feature.appointment.dto.RescheduleRequest;
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
import com.vaxcare.feature.inventory.repository.VaccineBatchRepository;
import com.vaxcare.feature.ai.service.AiDispatchService;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.utils.QRCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.repository.PaymentRepository;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AppointmentService {

    private static final int SLOT_DURATION_MINUTES = 30;

    /** Số ngày được đặt lại miễn phí sau mũi FAILED (cùng vắc xin + cơ sở). */
    private static final int FREE_REBOOK_WINDOW_DAYS = 14;

    private static final Set<AppointmentStatus> ACTIVE_STATUSES =
            Set.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN);

    private final AppointmentRepository appointmentRepository;
    private final AccountRepository accountRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineRepository vaccineRepository;
    private final PriceListRepository priceListRepository;
    private final AiDispatchService aiDispatchService;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final PaymentRepository paymentRepository;

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
                long booked = appointmentRepository.countBookingsInSlot(facilityId, date, cursor, null);
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

        // AI annotate lỗi không làm fail tra cứu slot (tránh UnexpectedRollbackException)
        try {
            return aiDispatchService.annotateSlots(facility, date, slots);
        } catch (Exception ex) {
            return slots;
        }
    }

    // ===================== ĐẶT / XEM LỊCH HẸN =====================

    @Transactional
    public List<AppointmentResponse> getMyAppointments(Long currentUserId) {
        User user = resolveUser(currentUserId);
        LocalDateTime now = LocalDateTime.now();
        return appointmentRepository.findByUserIdWithDetails(user.getUserId()).stream()
                .map(a -> {
                    expireIfPastSlot(a, now);
                    return mapToResponse(a);
                })
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
        ensureVaccineInStockAtFacility(facility.getFacilityId(), vaccine.getVaccineId());
        validateSlotWithinWorkingHours(facility, request.getAppointmentDate(), request.getTimeSlot());
        ensureSlotHasCapacity(facility, request.getAppointmentDate(), request.getTimeSlot(), null);
        ensureUserHasNoOverlappingSlot(user.getUserId(), request.getAppointmentDate(), request.getTimeSlot());
        enforceProtocolLimits(user.getUserId(), vaccine, request.getAppointmentDate());

        // --- Đặt lại miễn phí sau mũi FAILED (14 ngày, cùng vắc xin + cơ sở) ---
        FreeRebookInfo freeInfo = resolveFreeRebookEligibility(
                user.getUserId(), vaccine.getVaccineId(), facility.getFacilityId());

        java.math.BigDecimal price = resolveCurrentPrice(vaccine.getVaccineId(), facility.getFacilityId());
        if (!freeInfo.eligible()) {
            if (price == null || price.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new BadRequestException(
                        "Vắc xin này chưa có bảng giá hiệu lực tại cơ sở đã chọn. "
                                + "Vui lòng chọn vắc xin/cơ sở khác hoặc liên hệ quản trị để cập nhật giá.");
            }
        } else {
            // Miễn phí: không thu tiền
            price = java.math.BigDecimal.ZERO;
        }

        AppointmentStatus initialStatus = freeInfo.eligible()
                ? AppointmentStatus.CONFIRMED
                : AppointmentStatus.PENDING;
        String qrCode = freeInfo.eligible() ? QRCodeUtil.generateToken() : null;

        String note = request.getNote();
        if (freeInfo.eligible()) {
            String tag = "[Đặt lại miễn phí sau mũi FAILED ngày "
                    + freeInfo.failedDate() + " — không thu tiền]";
            note = (note == null || note.isBlank()) ? tag : note.trim() + " | " + tag;
        }

        Appointment appointment = Appointment.builder()
                .user(user)
                .facility(facility)
                .vaccine(vaccine)
                .price(price)
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(request.getTimeSlot())
                .status(initialStatus)
                .qrCode(qrCode)
                .note(note)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        try {
            aiDispatchService.applyAiMetadataOnBooking(saved);
            saved = appointmentRepository.save(saved);
        } catch (Exception ignored) {
            // đã log trong AiDispatchService/AiServiceClient nếu có lỗi gọi AI
        }

        AppointmentResponse response = mapToResponse(saved);
        if (freeInfo.eligible()) {
            response.setFreeRebook(true);
            response.setFreeRebookMessage(
                    "Bạn được đặt lại miễn phí trong "
                            + FREE_REBOOK_WINDOW_DAYS
                            + " ngày sau mũi tiêm không thành công (FAILED) cùng vắc xin và cơ sở. "
                            + "Lịch đã xác nhận, không cần thanh toán.");
        } else {
            response.setFreeRebook(false);
        }
        return response;
    }

    private record FreeRebookInfo(boolean eligible, java.time.LocalDate failedDate) {
        static FreeRebookInfo none() {
            return new FreeRebookInfo(false, null);
        }
    }

    /**
     * Đủ điều kiện đặt lại miễn phí nếu:
     * - Có mũi FAILED cùng user + vaccine + facility trong FREE_REBOOK_WINDOW_DAYS ngày gần nhất
     * - Chưa dùng suất miễn phí (chưa có appointment price=0 sau thời điểm FAILED)
     */
    private FreeRebookInfo resolveFreeRebookEligibility(Long userId, Long vaccineId, Long facilityId) {
        LocalDate fromDate = LocalDate.now().minusDays(FREE_REBOOK_WINDOW_DAYS);
        var failedList = vaccinationDetailRepository.findRecentFailedForRebook(
                userId, vaccineId, facilityId, fromDate);
        if (failedList == null || failedList.isEmpty()) {
            return FreeRebookInfo.none();
        }
        VaccinationDetail latestFailed = failedList.get(0);
        LocalDate failedDate = latestFailed.getInjectionDate();
        if (failedDate == null) {
            return FreeRebookInfo.none();
        }
        // since = đầu ngày mũi FAILED (tránh trùng suất)
        LocalDateTime since = failedDate.atStartOfDay();
        boolean alreadyUsed = appointmentRepository.existsFreeRebookSince(
                userId, vaccineId, facilityId, since);
        if (alreadyUsed) {
            return FreeRebookInfo.none();
        }
        return new FreeRebookInfo(true, failedDate);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, Long currentUserId, RescheduleRequest request) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);
        ensureModifiable(appointment, "đổi lịch hẹn");

        if (request.getAppointmentDate() == null) {
            throw new BadRequestException("Ngày hẹn không được để trống");
        }
        if (request.getTimeSlot() == null) {
            throw new BadRequestException("Khung giờ không được để trống");
        }

        // Chỉ đổi ngày + giờ; giữ nguyên cơ sở, vắc xin, giá, QR, trạng thái thanh toán
        VaccinationFacility facility = appointment.getFacility();
        Vaccine vaccine = appointment.getVaccine();
        LocalDate newDate = request.getAppointmentDate();
        LocalTime newTimeSlot = request.getTimeSlot();

        if (newDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Không thể đổi lịch sang ngày trong quá khứ");
        }

        validateFacilityAndVaccineActive(facility, vaccine);
        validateSlotWithinWorkingHours(facility, newDate, newTimeSlot);

        boolean slotUnchanged = newDate.isEqual(appointment.getAppointmentDate())
                && newTimeSlot.equals(appointment.getTimeSlot());
        if (!slotUnchanged) {
            ensureSlotHasCapacity(facility, newDate, newTimeSlot, appointment.getAppointmentId());
            ensureUserHasNoOverlappingSlot(appointment.getUser().getUserId(), newDate, newTimeSlot);
        }

        appointment.setAppointmentDate(newDate);
        appointment.setTimeSlot(newTimeSlot);
        // Không đổi facility / vaccine / price / qrCode / status (giữ CONFIRMED nếu đã thanh toán)

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long currentUserId, CancelAppointmentRequest request) {
        Appointment appointment = findAppointmentOrThrow(appointmentId);
        checkOwnership(appointment, currentUserId);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Lịch hẹn này đã bị hủy trước đó");
        }
        if (appointment.getStatus() == AppointmentStatus.CHECKED_IN || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Lịch hẹn đã check-in / hoàn tất tiêm chủng, không thể hủy");
        }

        if (isPastSlotEnd(appointment, LocalDateTime.now())) {
            // Hủy luôn thay vì báo lỗi để UI đồng bộ với cron
            expireIfPastSlot(appointment, LocalDateTime.now());
            return mapToResponse(appointment);
        }
        if (appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new BadRequestException("Lịch hẹn đã đánh dấu không đến, không thể hủy");
        }

        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointmentId).orElse(null);
        boolean isPaid = payment != null && payment.getStatus() == PaymentStatus.SUCCESS;

        String reason = request != null && request.getReason() != null ? request.getReason().trim() : "";
        if (isPaid) {
            // Bắt buộc có lý do khi hủy lịch đã thanh toán; không hoàn tiền
            if (reason.isBlank()) {
                throw new BadRequestException(
                        "Vui lòng nhập lý do hủy. Lịch đã thanh toán khi hủy sẽ không được hoàn tiền.");
            }
            reason = reason + " [Không hoàn tiền — user hủy sau thanh toán]";
        } else if (reason.isBlank()) {
            reason = "Người dùng chủ động hủy lịch hẹn chưa thanh toán (nhả slot)";
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancellationReason(reason);

        // Chỉ đánh FAILED cho payment đang PENDING; payment SUCCESS giữ nguyên (không hoàn tiền)
        if (payment != null && payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        return mapToResponse(appointmentRepository.save(appointment));
    }


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
        long booked = appointmentRepository.countBookingsInSlot(
                facility.getFacilityId(), date, timeSlot, excludeAppointmentId);
        int capacity = facility.getCapacityPerSlot() != null ? facility.getCapacityPerSlot() : 0;
        if (booked >= capacity) {
            throw new BadRequestException("Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác");
        }
    }


    private void ensureVaccineInStockAtFacility(Long facilityId, Long vaccineId) {
        Integer stock = vaccineBatchRepository.sumStockByFacilityAndVaccine(facilityId, vaccineId);
        if (stock == null || stock <= 0) {
            throw new BadRequestException(
                    "Cơ sở này hiện không còn tồn kho vắc xin đã chọn. Vui lòng chọn cơ sở khác hoặc vắc xin khác.");
        }
    }

    private void ensureUserHasNoOverlappingSlot(Long userId, LocalDate date, LocalTime timeSlot) {
        boolean exists = appointmentRepository.existsByUser_UserIdAndAppointmentDateAndTimeSlotAndStatusIn(
                userId, date, timeSlot, ACTIVE_STATUSES);
        if (exists) {
            throw new BadRequestException(
                    "Bạn đã có một lịch hẹn khác vào khung giờ " + timeSlot + " ngày " + date
                            + ". Vui lòng chọn khung giờ hoặc ngày khác.");
        }
    }

    /**
     * Giới hạn đặt lịch theo phác đồ:
     * - Không đặt thêm nếu đã tiêm/đặt đủ required_doses
     * - Không đặt thêm nếu chưa tới ngày hẹn mũi tiếp theo (tính từ mốc tiêm/đặt gần nhất + dose_interval_days)
     */
    private void enforceProtocolLimits(Long userId, Vaccine vaccine, LocalDate appointmentDate) {
        int required = vaccine.getRequiredDoses() != null && vaccine.getRequiredDoses() > 0
                ? vaccine.getRequiredDoses()
                : 1;

        long administered = vaccinationDetailRepository.countAdministeredDoses(userId, vaccine.getVaccineId());
        if (administered >= required) {
            throw new BadRequestException(
                    "Bạn đã hoàn thành đủ " + required + " mũi theo phác đồ của \""
                            + vaccine.getVaccineName()
                            + "\". Không thể đặt thêm lịch cho loại vắc xin này.");
        }

        long activeOpen = appointmentRepository.countByUserAndVaccineAndStatusIn(
                userId, vaccine.getVaccineId(), ACTIVE_STATUSES);
        if (administered + activeOpen >= required) {
            throw new BadRequestException(
                    "Bạn đang có lịch hẹn/mũi tiêm đang mở cho \"" + vaccine.getVaccineName()
                            + "\". Phác đồ tối đa " + required + " mũi (đã tiêm "
                            + administered + ", đang mở " + activeOpen
                            + "). Vui lòng hoàn tất hoặc hủy lịch hiện có trước khi đặt thêm.");
        }

        // Tìm mốc ngày gần nhất của vắc xin này (từ lịch sử tiêm hoặc từ các lịch hẹn đang mở)
        LocalDate lastInjection = vaccinationDetailRepository.findLastInjectionDate(userId, vaccine.getVaccineId());
        LocalDate lastAppointment = appointmentRepository.findLatestAppointmentDateByUserAndVaccine(
                userId, vaccine.getVaccineId(), ACTIVE_STATUSES);

        LocalDate latestPrevDate = null;
        if (lastInjection != null && lastAppointment != null) {
            latestPrevDate = lastInjection.isAfter(lastAppointment) ? lastInjection : lastAppointment;
        } else if (lastInjection != null) {
            latestPrevDate = lastInjection;
        } else if (lastAppointment != null) {
            latestPrevDate = lastAppointment;
        }

        if (latestPrevDate != null) {
            Integer intervalDays = vaccine.getDoseIntervalDays();
            if (intervalDays != null && intervalDays > 0) {
                long daysSince = ChronoUnit.DAYS.between(latestPrevDate, appointmentDate);
                if (daysSince < intervalDays) {
                    LocalDate earliest = latestPrevDate.plusDays(intervalDays);
                    throw new BadRequestException(
                            "Bạn đã đặt/tiêm vắc xin \"" + vaccine.getVaccineName()
                                    + "\" trước đó (mốc gần nhất: " + latestPrevDate
                                    + "). Chưa tới lịch tiêm mũi tiếp theo. Cần cách tối thiểu " + intervalDays
                                    + " ngày. Ngày sớm nhất có thể đặt: " + earliest + ".");
                }
            } else {
                throw new BadRequestException(
                        "Bạn đã đặt/tiêm vắc xin \"" + vaccine.getVaccineName()
                                + "\" trước đó. Loại vắc xin này không cho phép đặt nhiều mũi cùng lúc.");
            }
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
        if (isPastSlotEnd(appointment, LocalDateTime.now())) {
            throw new BadRequestException(
                    "Không thể " + action + " vì đã quá khung giờ tiêm. Hệ thống sẽ tự hủy lịch chưa check-in.");
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


    private static final String AUTO_CANCEL_REASON_EXPIRED_SLOT =
            "Hệ thống tự hủy: đã quá ngày/giờ tiêm mà chưa check-in";

    public boolean isPastSlotEnd(Appointment appointment, LocalDateTime now) {
        if (appointment.getAppointmentDate() == null || appointment.getTimeSlot() == null) {
            return false;
        }
        LocalDateTime slotEnd = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getTimeSlot())
                .plusMinutes(SLOT_DURATION_MINUTES);
        return !now.isBefore(slotEnd);
    }

    public void expireIfPastSlot(Appointment appointment, LocalDateTime now) {
        if (appointment.getStatus() != AppointmentStatus.PENDING
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return;
        }
        if (!isPastSlotEnd(appointment, now)) {
            return;
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(now);
        if (appointment.getCancellationReason() == null || appointment.getCancellationReason().isBlank()) {
            appointment.setCancellationReason(AUTO_CANCEL_REASON_EXPIRED_SLOT);
        }
        appointmentRepository.save(appointment);
        paymentRepository.findByAppointment_AppointmentId(appointment.getAppointmentId()).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.PENDING) {
                p.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        });
    }

    public AppointmentResponse mapToResponse(Appointment appointment) {
        Payment payment = paymentRepository.findByAppointment_AppointmentId(appointment.getAppointmentId()).orElse(null);
        PaymentStatus paymentStatus = payment != null ? payment.getStatus() : null;
        boolean paid = paymentStatus == PaymentStatus.SUCCESS;

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
                .predictionId(appointment.getPredictionId())
                .appointmentDate(appointment.getAppointmentDate())
                .timeSlot(appointment.getTimeSlot())
                .status(appointment.getStatus())
                .qrCode(appointment.getQrCode())
                .note(appointment.getNote())
                .createdAt(appointment.getCreatedAt())
                .paymentStatus(paymentStatus)
                .paid(paid)
                .cancelledAt(appointment.getCancelledAt())
                .cancellationReason(appointment.getCancellationReason())
                .freeRebook(
                        appointment.getPrice() != null
                                && appointment.getPrice().compareTo(java.math.BigDecimal.ZERO) == 0
                                && appointment.getNote() != null
                                && appointment.getNote().contains("Đặt lại miễn phí"))
                .build();
    }
}