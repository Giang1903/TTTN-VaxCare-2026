package com.vaxcare.config;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.common.enums.BatchStatus;
import com.vaxcare.common.enums.PaymentMethod;
import com.vaxcare.common.enums.PaymentStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.appointment.entity.Payment;
import com.vaxcare.feature.appointment.repository.AppointmentRepository;
import com.vaxcare.feature.appointment.repository.PaymentRepository;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.feature.auth.repository.UserRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import com.vaxcare.feature.inventory.entity.VaccineInventory;
import com.vaxcare.feature.inventory.repository.VaccineBatchRepository;
import com.vaxcare.feature.inventory.repository.VaccineInventoryRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.feature.vaccination.repository.VaccinationHistoryRepository;
import com.vaxcare.feature.vaccine.entity.PriceList;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.PriceListRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DataSeeder implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final MedicalStaffRepository medicalStaffRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineRepository vaccineRepository;
    private final PriceListRepository priceListRepository;
    private final VaccineInventoryRepository vaccineInventoryRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final VaccinationHistoryRepository vaccinationHistoryRepository;
    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final PasswordEncoder passwordEncoder;
    private static final int NEW_USERS = 20;
    private static final int HISTORY_WEEKS = 10;
    private static final int FUTURE_DAYS = 14;
    private static final int SLOT_MINUTES = 30;
    private static final long RANDOM_SEED = 20260924L;
    private static final String EMAIL_PREFIX = "seed.";

    @Override
    public void run(String... args) {
        log.info("========== DataSeeder bắt đầu ==========");

        // ===== CỜ: đã seed lần nào chưa =====
        if (accountRepository.existsByEmail(EMAIL_PREFIX + "user01@vaxcare.com")) {
            log.info("Đã seed dữ liệu trước đó → bỏ qua hoàn toàn");
            log.info("========== DataSeeder kết thúc (không làm gì) ==========");
            return;
        }

        List<VaccinationFacility> facilities = facilityRepository.findAll();
        List<Vaccine> vaccines = vaccineRepository.findAll();

        if (facilities.isEmpty() || vaccines.isEmpty()) {
            log.warn("Thiếu Facility hoặc Vaccine trong DB → không thể seed. Hãy import file SQL trước.");
            return;
        }

        // 1. Tạo user mới
        List<User> newUsers = seedNewUsers();

        // 2. Tạo thêm staff
        seedExtraStaff(facilities);

        // 3. Bổ sung batch đa dạng
        seedExtraBatches(facilities, vaccines);

        // 4. Tạo lịch hẹn + thanh toán + chi tiết tiêm đa dạng
        seedDiverseAppointments(newUsers, facilities, vaccines);

        log.info("========== DataSeeder hoàn tất (đã seed lần đầu) ==========");
    }

    private List<User> seedNewUsers() {
        List<User> created = new ArrayList<>();
        Random rnd = new Random(RANDOM_SEED);

        String[] first = {"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"};
        String[] mid   = {"Văn", "Thị", "Minh", "Ngọc", "Hữu", "Gia", "Bảo", "Kim", "Thanh"};
        String[] last  = {"An", "Bình", "Chi", "Dũng", "Em", "Giang", "Hà", "Khang", "Linh", "Nam",
                          "Oanh", "Phúc", "Quân", "Sang", "Thảo", "Uyên", "Vy", "Xuân", "Yến", "Tâm"};

        for (int i = 1; i <= NEW_USERS; i++) {
            String email = EMAIL_PREFIX + String.format("user%02d@vaxcare.com", i);

            if (accountRepository.existsByEmail(email)) {
                accountRepository.findByEmail(email).ifPresent(acc -> {
                    if (acc.getUser() != null) created.add(acc.getUser());
                });
                continue;
            }

            String fullName = first[rnd.nextInt(first.length)] + " "
                    + mid[rnd.nextInt(mid.length)] + " "
                    + last[rnd.nextInt(last.length)];

            Account acc = accountRepository.save(Account.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("user123"))
                    .phone(String.format("09%08d", 20000000 + i))
                    .role(Role.USER)
                    .status(AccountStatus.ACTIVE)
                    .build());

            int ageMonths = 6 + rnd.nextInt(50 * 12); // 6 tháng → ~50 tuổi
            User user = User.builder()
                    .account(acc)
                    .userId(acc.getAccountId())
                    .fullName(fullName)
                    .dateOfBirth(LocalDate.now().minusMonths(ageMonths))
                    .address("Địa chỉ seed " + i + ", TP.HCM")
                    .build();
            acc.setUser(user);
            accountRepository.save(acc);

            created.add(user);
            log.info("Tạo user mới: {} ({})", fullName, email);
        }

        log.info("→ Tổng user mới: {}", created.size());
        return created;
    }

    private void seedExtraStaff(List<VaccinationFacility> facilities) {
        String[] names = {"BS. Nguyễn Thị Hồng", "BS. Trần Quốc Bảo", "BS. Lê Minh Tuấn"};

        for (int i = 0; i < Math.min(3, facilities.size()); i++) {
            String email = EMAIL_PREFIX + String.format("staff%02d@vaxcare.com", i + 1);
            if (accountRepository.existsByEmail(email)) continue;

            Account acc = accountRepository.save(Account.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("staff123"))
                    .phone(String.format("098%07d", 1000000 + i))
                    .role(Role.MEDICAL_STAFF)
                    .status(AccountStatus.ACTIVE)
                    .build());

            MedicalStaff staff = MedicalStaff.builder()
                    .account(acc)
                    .staffId(acc.getAccountId())
                    .fullName(names[i])
                    .staffCode("SEED-STF-" + (i + 1))
                    .specialty("Tiêm chủng")
                    .facility(facilities.get(i))
                    .build();
            acc.setMedicalStaff(staff);
            accountRepository.save(acc);

            log.info("Tạo staff mới: {}", email);
        }
    }

    private void seedExtraBatches(List<VaccinationFacility> facilities, List<Vaccine> vaccines) {
    LocalDate today = LocalDate.now();
    Random rnd = new Random(RANDOM_SEED + 99);

    // Lấy tất cả batch hiện có để tránh trùng batchNumber
    List<String> existingBatchNumbers = vaccineBatchRepository.findAll()
            .stream()
            .map(VaccineBatch::getBatchNumber)
            .toList();

    for (VaccinationFacility fac : facilities) {
        VaccineInventory inv = vaccineInventoryRepository.findByFacility_FacilityId(fac.getFacilityId())
                .orElseGet(() -> vaccineInventoryRepository.save(
                        VaccineInventory.builder()
                                .facility(fac)
                                .alertThreshold(50)
                                .build()));

        for (Vaccine vac : vaccines) {
            String batchNo = "SEED-LOT-" + fac.getFacilityId() + "-" + vac.getVaccineId();

            // Đã tồn tại thì bỏ qua
            if (existingBatchNumbers.contains(batchNo)) {
                continue;
            }

            int stock = 10 + rnd.nextInt(90);
            int imported = stock + rnd.nextInt(30);
            LocalDate mfg = today.minusMonths(1 + rnd.nextInt(10));
            LocalDate exp = today.plusDays(30 + rnd.nextInt(400));

            BatchStatus status = BatchStatus.AVAILABLE;
            if (exp.isBefore(today)) {
                status = BatchStatus.EXPIRED;
            } else if (stock <= 5) {
                status = BatchStatus.DEPLETED;
            }

            vaccineBatchRepository.save(VaccineBatch.builder()
                    .inventory(inv)
                    .vaccine(vac)
                    .batchNumber(batchNo)
                    .manufactureDate(mfg)
                    .expiryDate(exp)
                    .importedQuantity(imported)
                    .stockQuantity(Math.max(0, stock))
                    .importPrice(new BigDecimal(40000 + rnd.nextInt(30000)))
                    .importDate(mfg.plusDays(5))
                    .status(status)
                    .build());
        }
    }
    log.info("→ Đã bổ sung batch đa dạng (SEED-LOT-*)");
}
    private void seedDiverseAppointments(List<User> users,
                                         List<VaccinationFacility> facilities,
                                         List<Vaccine> vaccines) {

        if (users.isEmpty()) {
            log.warn("Không có user mới → bỏ qua seed appointment");
            return;
        }

        Map<Long, List<MedicalStaff>> staffMap = new HashMap<>();
        for (VaccinationFacility f : facilities) {
            staffMap.put(f.getFacilityId(),
                    medicalStaffRepository.findByFacility_FacilityId(f.getFacilityId()));
        }

        Random rnd = new Random(RANDOM_SEED + 7);
        LocalDate today = LocalDate.now();
        LocalDate pastStart = today.minusWeeks(HISTORY_WEEKS);

        int totalCreated = 0;
        int certSeq = 5000;

        // Mỗi user có số lượng lịch khác nhau (1 → 6)
        for (User user : users) {
            int numAppts = 1 + rnd.nextInt(6);

            for (int k = 0; k < numAppts; k++) {
                // 70% quá khứ, 30% hiện tại / tương lai
                LocalDate date;
                if (rnd.nextDouble() < 0.70) {
                    long days = pastStart.toEpochDay()
                            + rnd.nextInt((int) (today.toEpochDay() - pastStart.toEpochDay() + 1));
                    date = LocalDate.ofEpochDay(days);
                } else {
                    long days = today.toEpochDay() + rnd.nextInt(FUTURE_DAYS + 1);
                    date = LocalDate.ofEpochDay(days);
                }

                VaccinationFacility facility = facilities.get(rnd.nextInt(facilities.size()));
                Vaccine vaccine = vaccines.get(rnd.nextInt(vaccines.size()));
                List<MedicalStaff> staffList = staffMap.getOrDefault(facility.getFacilityId(), List.of());
                MedicalStaff staff = staffList.isEmpty() ? null : staffList.get(rnd.nextInt(staffList.size()));

                LocalTime timeSlot = pickWeightedTimeSlot(facility, rnd, date);
                if (timeSlot == null) continue;

                AppointmentStatus status = pickStatus(date, today, rnd);
                BigDecimal price = resolvePrice(vaccine, facility);

                String qr = "SEED-QR-" + user.getUserId() + "-" + (System.nanoTime() % 100000);

                Appointment.AppointmentBuilder builder = Appointment.builder()
                        .user(user)
                        .facility(facility)
                        .vaccine(vaccine)
                        .staff(status == AppointmentStatus.CANCELLED ? null : staff)
                        .price(price)
                        .appointmentDate(date)
                        .timeSlot(timeSlot)
                        .status(status)
                        .qrCode(qr);

                if (status == AppointmentStatus.CANCELLED) {
                    builder.cancelledAt(date.atTime(timeSlot).minusHours(1 + rnd.nextInt(24)))
                           .cancellationReason(pickCancelReason(rnd));
                }

                Appointment appt = appointmentRepository.save(builder.build());
                totalCreated++;

                // Thanh toán
                createPaymentIfNeeded(appt, status, price, date, timeSlot, rnd);

                // Chi tiết tiêm chỉ khi COMPLETED
                if (status == AppointmentStatus.COMPLETED) {
                    createVaccinationDetail(user, appt, vaccine, staff, date, rnd, certSeq++);
                }
            }
        }

        log.info("→ Đã tạo thêm {} lịch hẹn mới (đa dạng trạng thái + ngày)", totalCreated);
    }

    private void createPaymentIfNeeded(Appointment appt,
                                       AppointmentStatus status,
                                       BigDecimal price,
                                       LocalDate date,
                                       LocalTime time,
                                       Random rnd) {
        if (price == null) return;

        // Lịch PENDING tương lai thường chưa thanh toán
        if (status == AppointmentStatus.PENDING && rnd.nextDouble() < 0.55) return;

        PaymentStatus pStatus;
        if (status == AppointmentStatus.CANCELLED) {
            pStatus = rnd.nextBoolean() ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS;
        } else if (status == AppointmentStatus.NO_SHOW) {
            pStatus = PaymentStatus.SUCCESS;
        } else {
            pStatus = PaymentStatus.SUCCESS;
        }

        paymentRepository.save(Payment.builder()
                .appointment(appt)
                .transactionId("SEED-TXN-" + appt.getAppointmentId() + "-"
                        + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .amount(price)
                .paymentMethod(rnd.nextBoolean() ? PaymentMethod.VNPAY : PaymentMethod.ZALOPAY)
                .status(pStatus)
                .paymentTime(date.atTime(time).minusHours(1 + rnd.nextInt(12)))
                .build());
    }

    private void createVaccinationDetail(User user,
                                         Appointment appt,
                                         Vaccine vaccine,
                                         MedicalStaff staff,
                                         LocalDate date,
                                         Random rnd,
                                         int certSeq) {
        VaccinationHistory history = vaccinationHistoryRepository
                .findByUser_UserId(user.getUserId())
                .orElseGet(() -> vaccinationHistoryRepository.save(
                        VaccinationHistory.builder().user(user).build()));

        VaccinationResult result = pickResult(rnd);
        int dose = (int) vaccinationDetailRepository
                .countByHistory_HistoryIdAndVaccine_VaccineIdAndResultNot(
                        history.getHistoryId(), vaccine.getVaccineId(), VaccinationResult.FAILED) + 1;

        vaccinationDetailRepository.save(VaccinationDetail.builder()
                .history(history)
                .appointment(appt)
                .vaccine(vaccine)
                .batch(null) // không trừ kho thật
                .staff(staff)
                .doseNumber(dose)
                .injectionDate(date)
                .result(result)
                .certificateCode(result == VaccinationResult.SUCCESS
                        ? "SEED-CERT-" + String.format("%05d", certSeq) : null)
                .build());
    }

    private AppointmentStatus pickStatus(LocalDate date, LocalDate today, Random rnd) {
        if (date.isAfter(today)) {
            double r = rnd.nextDouble();
            if (r < 0.45) return AppointmentStatus.PENDING;
            if (r < 0.85) return AppointmentStatus.CONFIRMED;
            return AppointmentStatus.CANCELLED;
        }
        if (date.isEqual(today)) {
            double r = rnd.nextDouble();
            if (r < 0.20) return AppointmentStatus.PENDING;
            if (r < 0.40) return AppointmentStatus.CONFIRMED;
            if (r < 0.60) return AppointmentStatus.CHECKED_IN;
            if (r < 0.85) return AppointmentStatus.COMPLETED;
            return AppointmentStatus.CANCELLED;
        }
        // Quá khứ
        double r = rnd.nextDouble();
        if (r < 0.72) return AppointmentStatus.COMPLETED;
        if (r < 0.85) return AppointmentStatus.CANCELLED;
        if (r < 0.93) return AppointmentStatus.NO_SHOW;
        return AppointmentStatus.COMPLETED;
    }

    private LocalTime pickWeightedTimeSlot(VaccinationFacility facility, Random rnd, LocalDate date) {
        if (facility.getOpeningTime() == null || facility.getClosingTime() == null) {
            return LocalTime.of(8 + rnd.nextInt(8), rnd.nextBoolean() ? 0 : 30);
        }

        List<LocalTime> slots = new ArrayList<>();
        List<Double> weights = new ArrayList<>();
        LocalTime t = facility.getOpeningTime();

        while (t.isBefore(facility.getClosingTime())) {
            slots.add(t);
            weights.add(timeWeight(t) * dayWeight(date.getDayOfWeek()));
            t = t.plusMinutes(SLOT_MINUTES);
        }

        if (slots.isEmpty()) return LocalTime.of(9, 0);

        double total = weights.stream().mapToDouble(Double::doubleValue).sum();
        double r = rnd.nextDouble() * total;
        double cum = 0;
        for (int i = 0; i < slots.size(); i++) {
            cum += weights.get(i);
            if (r <= cum) return slots.get(i);
        }
        return slots.get(slots.size() - 1);
    }

    private double timeWeight(LocalTime t) {
        int m = t.getHour() * 60 + t.getMinute();
        if (m >= 8 * 60 && m < 10 * 60) return 3.0;           // cao điểm sáng
        if (m >= 14 * 60 && m < 16 * 60) return 2.5;          // cao điểm chiều
        if (m >= 11 * 60 + 30 && m < 13 * 60 + 30) return 0.4; // nghỉ trưa
        return 1.3;
    }

    private double dayWeight(DayOfWeek d) {
        return switch (d) {
            case SATURDAY -> 1.9;
            case SUNDAY -> 1.5;
            case MONDAY -> 1.35;
            case FRIDAY -> 1.2;
            default -> 1.0;
        };
    }

    private VaccinationResult pickResult(Random rnd) {
        double r = rnd.nextDouble();
        if (r < 0.94) return VaccinationResult.SUCCESS;
        if (r < 0.98) return VaccinationResult.PARTIAL;
        return VaccinationResult.FAILED;
    }

    private String pickCancelReason(Random rnd) {
        String[] reasons = {
                "Người dùng bận việc đột xuất",
                "Trẻ bị sốt nhẹ, hoãn lịch tiêm",
                "Đổi sang cơ sở khác gần nhà hơn",
                "Không còn nhu cầu tiêm mũi này",
                "Lịch trùng công việc"
        };
        return reasons[rnd.nextInt(reasons.length)];
    }

    private BigDecimal resolvePrice(Vaccine vaccine, VaccinationFacility facility) {
        return priceListRepository
                .findByVaccine_VaccineIdAndStatus(vaccine.getVaccineId(), ActiveStatus.ACTIVE)
                .stream()
                .filter(p -> p.getFacility() == null
                        || p.getFacility().getFacilityId().equals(facility.getFacilityId()))
                .findFirst()
                .map(PriceList::getPrice)
                .orElse(new BigDecimal("350000"));
    }
}