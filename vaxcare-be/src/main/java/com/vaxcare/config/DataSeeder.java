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
import com.vaxcare.feature.auth.entity.Admin;
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
import com.vaxcare.feature.vaccine.entity.ProtocolDetail;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.entity.VaccinationProtocol;
import com.vaxcare.feature.vaccine.entity.VaccineCategory;
import com.vaxcare.feature.vaccine.repository.PriceListRepository;
import com.vaxcare.feature.vaccine.repository.ProtocolDetailRepository;
import com.vaxcare.feature.vaccine.repository.VaccinationProtocolRepository;
import com.vaxcare.feature.vaccine.repository.VaccineCategoryRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DataSeeder implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineCategoryRepository vaccineCategoryRepository;
    private final VaccineRepository vaccineRepository;
    private final VaccinationProtocolRepository protocolRepository;
    private final ProtocolDetailRepository protocolDetailRepository;
    private final PriceListRepository priceListRepository;
    private final VaccineInventoryRepository vaccineInventoryRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final PasswordEncoder passwordEncoder;

    // ==== Thêm cho seed lịch sử Appointment + VaccinationDetail (task 26/08) ====
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final VaccinationHistoryRepository vaccinationHistoryRepository;
    private final VaccinationDetailRepository vaccinationDetailRepository;
    private final MedicalStaffRepository medicalStaffRepository;
    private final UserRepository userRepository;

    /** Số tuần lịch sử cần sinh. AiDispatchService đang lấy lịch sử 8 tuần (HISTORY_WEEKS) để tính pattern theo (thứ, khung giờ). */
    private static final int HISTORY_WEEKS = 8;
    private static final int SLOT_DURATION_MINUTES = 30;
    private static final int PATIENT_COUNT = 40;

    // Random có seed cố định -> mỗi lần chạy trên DB rỗng sẽ sinh ra cùng 1 bộ dữ liệu, tiện cho FE/QA/AI đối chiếu.
    private static final long RANDOM_SEED = 20260826L;

    @Override
    public void run(String... args) {
        seedFacilities();
        seedAccounts();
        seedVaccineCatalog();
        seedInventoryBatches();
        seedAppointmentHistory();
    }

    private void seedFacilities() {
        if (facilityRepository.count() > 0) {
            return;
        }

        List<VaccinationFacility> facilities = List.of(
                VaccinationFacility.builder()
                        .facilityName("Cơ sở tiêm chủng Trung tâm Y tế Quận 1")
                        .address("123 Lê Lợi, Quận 1, TP.HCM")
                        .phone("028-3821-1234")
                        .openingTime(LocalTime.of(8, 0))
                        .closingTime(LocalTime.of(17, 0))
                        .capacityPerSlot(20)
                        .imageUrl("https://images.example.com/facility-1.jpg")
                        .status(ActiveStatus.ACTIVE)
                        .build(),
                VaccinationFacility.builder()
                        .facilityName("Phòng khám Đa khoa Bệnh viện Tân Bình")
                        .address("456 Hoàng Văn Thụ, Tân Bình, TP.HCM")
                        .phone("028-3810-5678")
                        .openingTime(LocalTime.of(7, 30))
                        .closingTime(LocalTime.of(16, 30))
                        .capacityPerSlot(15)
                        .imageUrl("https://images.example.com/facility-2.jpg")
                        .status(ActiveStatus.ACTIVE)
                        .build(),
                VaccinationFacility.builder()
                        .facilityName("Trung tâm Tiêm chủng Gia đình Thủ Đức")
                        .address("789 Võ Văn Ngân, Thủ Đức, TP.HCM")
                        .phone("028-3987-9012")
                        .openingTime(LocalTime.of(8, 30))
                        .closingTime(LocalTime.of(18, 0))
                        .capacityPerSlot(25)
                        .imageUrl("https://images.example.com/facility-3.jpg")
                        .status(ActiveStatus.ACTIVE)
                        .build()
        );

        facilityRepository.saveAll(facilities);
    }

    private void seedAccounts() {
        if (accountRepository.count() > 0) {
            return;
        }

        List<VaccinationFacility> facilities = facilityRepository.findAll().stream()
                .sorted(Comparator.comparing(VaccinationFacility::getFacilityId))
                .toList();
        VaccinationFacility facility = facilities.stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Cơ sở tiêm chủng mẫu chưa được khởi tạo"));

        Account adminAccount = Account.builder()
                .email("admin@vaxcare.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .phone("0909000001")
                .role(Role.ADMIN)
                .status(AccountStatus.ACTIVE)
                .build();
        adminAccount = accountRepository.save(adminAccount);

        Admin admin = Admin.builder()
                .account(adminAccount)
                .adminId(adminAccount.getAccountId())
                .fullName("Quản trị viên hệ thống")
                .adminLevel("SYSTEM")
                .build();
        adminAccount.setAdmin(admin);
        accountRepository.save(adminAccount);

        Account staffAccount = Account.builder()
                .email("staff@vaxcare.com")
                .passwordHash(passwordEncoder.encode("staff123"))
                .phone("0909000002")
                .role(Role.MEDICAL_STAFF)
                .status(AccountStatus.ACTIVE)
                .build();
        staffAccount = accountRepository.save(staffAccount);

        MedicalStaff staff = MedicalStaff.builder()
                .account(staffAccount)
                .staffId(staffAccount.getAccountId())
                .fullName("Bác sĩ Nguyễn Thị Lan")
                .staffCode("MS-001")
                .specialty("Nhi khoa")
                .facility(facility)
                .build();
        staffAccount.setMedicalStaff(staff);
        accountRepository.save(staffAccount);

        Account userAccount = Account.builder()
                .email("user@vaxcare.com")
                .passwordHash(passwordEncoder.encode("user123"))
                .phone("0909000003")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .build();
        userAccount = accountRepository.save(userAccount);

        User user = User.builder()
                .account(userAccount)
                .userId(userAccount.getAccountId())
                .fullName("Nguyễn Văn A")
                .address("22 Nguyễn Huệ, Q1, TP.HCM")
                .build();
        userAccount.setUser(user);
        accountRepository.save(userAccount);

        // Thêm 1 nhân viên y tế cho các cơ sở còn lại (nếu có), để lịch sử tiêm chủng ở đủ 3 cơ sở đều có staff hợp lệ
        String[] staffNames = {"Bác sĩ Trần Văn Hùng", "Bác sĩ Phạm Thị Mai"};
        for (int i = 1; i < facilities.size(); i++) {
            VaccinationFacility otherFacility = facilities.get(i);
            String email = "staff" + (i + 1) + "@vaxcare.com";
            Account otherStaffAccount = Account.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("staff123"))
                    .phone("090900000" + (3 + i))
                    .role(Role.MEDICAL_STAFF)
                    .status(AccountStatus.ACTIVE)
                    .build();
            otherStaffAccount = accountRepository.save(otherStaffAccount);

            MedicalStaff otherStaff = MedicalStaff.builder()
                    .account(otherStaffAccount)
                    .staffId(otherStaffAccount.getAccountId())
                    .fullName(staffNames[(i - 1) % staffNames.length])
                    .staffCode("MS-00" + (i + 1))
                    .specialty("Nhi khoa")
                    .facility(otherFacility)
                    .build();
            otherStaffAccount.setMedicalStaff(otherStaff);
            accountRepository.save(otherStaffAccount);
        }

        seedHistoryPatients();
    }

    /**
     * Sinh thêm PATIENT_COUNT tài khoản khách hàng (ngoài user@vaxcare.com) để có đủ dữ liệu người dùng
     * cho việc dựng lịch sử đặt lịch/tiêm chủng nhiều tuần (seedAppointmentHistory).
     */
    private void seedHistoryPatients() {
        String[] firstNames = {"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"};
        String[] middleNames = {"Văn", "Thị", "Hữu", "Minh", "Ngọc", "Gia", "Bảo", "Kim"};
        String[] lastNames = {"An", "Bình", "Chi", "Dũng", "Em", "Giang", "Hà", "Khang", "Linh", "Nam",
                "Oanh", "Phúc", "Quân", "Sang", "Thảo", "Uyên", "Vy", "Xuân", "Yến", "Tâm"};

        Random nameRandom = new Random(RANDOM_SEED);
        LocalDate dobBase = LocalDate.now();

        for (int i = 1; i <= PATIENT_COUNT; i++) {
            String fullName = firstNames[nameRandom.nextInt(firstNames.length)]
                    + " " + middleNames[nameRandom.nextInt(middleNames.length)]
                    + " " + lastNames[nameRandom.nextInt(lastNames.length)];

            Account patientAccount = Account.builder()
                    .email(String.format("patient%02d@vaxcare.com", i))
                    .passwordHash(passwordEncoder.encode("patient123"))
                    .phone(String.format("09%08d", 10000000 + i))
                    .role(Role.USER)
                    .status(AccountStatus.ACTIVE)
                    .build();
            patientAccount = accountRepository.save(patientAccount);

            // Trải đều độ tuổi từ trẻ sơ sinh (vài tháng) tới người lớn (~45 tuổi) để phù hợp nhiều loại vắc xin
            int ageMonths = 2 + nameRandom.nextInt(45 * 12);
            User patient = User.builder()
                    .account(patientAccount)
                    .userId(patientAccount.getAccountId())
                    .fullName(fullName)
                    .dateOfBirth(dobBase.minusMonths(ageMonths))
                    .address("Địa chỉ demo số " + i + ", TP.HCM")
                    .build();
            patientAccount.setUser(patient);
            accountRepository.save(patientAccount);
        }
    }

    private void seedVaccineCatalog() {
        if (vaccineCategoryRepository.count() > 0) {
            return;
        }

        VaccineCategory childCategory = vaccineCategoryRepository.save(VaccineCategory.builder()
                .categoryName("Vắc xin cho Trẻ em")
                .description("Các vắc xin trong chương trình tiêm chủng dành cho trẻ sơ sinh và trẻ nhỏ")
                .build());

        VaccineCategory adultCategory = vaccineCategoryRepository.save(VaccineCategory.builder()
                .categoryName("Vắc xin cho Người lớn")
                .description("Các vắc xin phòng bệnh dành cho người trưởng thành")
                .build());

        VaccineCategory pregnancyCategory = vaccineCategoryRepository.save(VaccineCategory.builder()
                .categoryName("Vắc xin cho Phụ nữ mang thai")
                .description("Các vắc xin khuyến cáo tiêm trong thai kỳ")
                .build());

        // 1) Vắc xin 6 trong 1 - trẻ em 2-24 tháng tuổi
        Vaccine vaccine6in1 = vaccineRepository.save(Vaccine.builder()
                .category(childCategory)
                .vaccineName("Vắc xin 6 trong 1 (Hexaxim)")
                .manufacturer("Sanofi Pasteur")
                .targetDisease("Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib")
                .requiredDoses(3)
                .doseIntervalDays(30)
                .description("Phòng 6 bệnh nguy hiểm cho trẻ nhỏ trong 1 mũi tiêm")
                .imageUrl("https://images.example.com/vaccine-6in1.jpg")
                .build());
        seedProtocol(vaccine6in1, "Phác đồ cơ bản 6 trong 1", 3,
                new int[][]{{2, 24, 0}, {3, 25, 30}, {4, 26, 30}});
        seedPrice(vaccine6in1, new BigDecimal("980000"));

        // 2) Vắc xin Sởi - Quai bị - Rubella (MMR) - trẻ em 12-72 tháng tuổi
        Vaccine vaccineMmr = vaccineRepository.save(Vaccine.builder()
                .category(childCategory)
                .vaccineName("Vắc xin Sởi - Quai bị - Rubella (MMR)")
                .manufacturer("MSD")
                .targetDisease("Sởi, Quai bị, Rubella")
                .requiredDoses(2)
                .doseIntervalDays(90)
                .description("Phòng 3 bệnh truyền nhiễm phổ biến ở trẻ nhỏ")
                .imageUrl("https://images.example.com/vaccine-mmr.jpg")
                .build());
        seedProtocol(vaccineMmr, "Phác đồ cơ bản MMR", 2,
                new int[][]{{12, 72, 0}, {13, 73, 90}});
        seedPrice(vaccineMmr, new BigDecimal("450000"));

        // 3) Vắc xin Cúm mùa - người lớn từ 18 tuổi (216 tháng) trở lên
        Vaccine vaccineFlu = vaccineRepository.save(Vaccine.builder()
                .category(adultCategory)
                .vaccineName("Vắc xin Cúm mùa (Influvac Tetra)")
                .manufacturer("Abbott")
                .targetDisease("Cúm mùa")
                .requiredDoses(1)
                .doseIntervalDays(365)
                .description("Tiêm nhắc lại hằng năm để phòng cúm mùa")
                .imageUrl("https://images.example.com/vaccine-flu.jpg")
                .build());
        seedProtocol(vaccineFlu, "Phác đồ tiêm hằng năm", 1,
                new int[][]{{216, 0, 0}});
        seedPrice(vaccineFlu, new BigDecimal("350000"));

        // 4) Vắc xin Uốn ván cho phụ nữ mang thai (VAT) - từ 180 tháng tuổi (15 tuổi) trở lên
        Vaccine vaccineVat = vaccineRepository.save(Vaccine.builder()
                .category(pregnancyCategory)
                .vaccineName("Vắc xin Uốn ván (VAT)")
                .manufacturer("Viện Vắc xin và Sinh phẩm Y tế (IVAC)")
                .targetDisease("Uốn ván")
                .requiredDoses(2)
                .doseIntervalDays(30)
                .description("Khuyến cáo tiêm cho phụ nữ mang thai để phòng uốn ván rốn sơ sinh")
                .imageUrl("https://images.example.com/vaccine-vat.jpg")
                .build());
        seedProtocol(vaccineVat, "Phác đồ cho phụ nữ mang thai", 2,
                new int[][]{{180, 0, 0}, {181, 0, 30}});
        seedPrice(vaccineVat, new BigDecimal("120000"));

        // 5) Vắc xin Viêm gan B đơn - trẻ sơ sinh 0-2 tháng tuổi (mũi sơ sinh)
        Vaccine vaccineHepB = vaccineRepository.save(Vaccine.builder()
                .category(childCategory)
                .vaccineName("Vắc xin Viêm gan B (Euvax B)")
                .manufacturer("LG Chem")
                .targetDisease("Viêm gan B")
                .requiredDoses(3)
                .doseIntervalDays(30)
                .description("Tiêm mũi sơ sinh trong vòng 24h đầu sau sinh để phòng lây truyền từ mẹ sang con")
                .imageUrl("https://images.example.com/vaccine-hepb.jpg")
                .build());
        seedProtocol(vaccineHepB, "Phác đồ sơ sinh", 3,
                new int[][]{{0, 2, 0}, {1, 3, 30}, {6, 8, 150}});
        seedPrice(vaccineHepB, new BigDecimal("185000"));

        // 6) Vắc xin phòng Dại - mọi lứa tuổi, tiêm dự phòng trước phơi nhiễm
        Vaccine vaccineRabies = vaccineRepository.save(Vaccine.builder()
                .category(adultCategory)
                .vaccineName("Vắc xin phòng Dại (Verorab)")
                .manufacturer("Sanofi Pasteur")
                .targetDisease("Bệnh Dại")
                .requiredDoses(3)
                .doseIntervalDays(7)
                .description("Tiêm dự phòng trước phơi nhiễm cho người có nguy cơ cao (thú y, người hay tiếp xúc động vật)")
                .imageUrl("https://images.example.com/vaccine-rabies.jpg")
                .build());
        seedProtocol(vaccineRabies, "Phác đồ dự phòng trước phơi nhiễm", 3,
                new int[][]{{0, 0, 0}, {0, 0, 7}, {0, 0, 21}});
        seedPrice(vaccineRabies, new BigDecimal("270000"));
    }

    /**
     * Sinh phác đồ + chi tiết phác đồ cho 1 vắc xin.
     * doseRows: mỗi phần tử là {ageFromMonths, ageToMonths (0 = không giới hạn trên), intervalDays}
     */
    private void seedProtocol(Vaccine vaccine, String protocolName, int totalDoses, int[][] doseRows) {
        VaccinationProtocol protocol = protocolRepository.save(VaccinationProtocol.builder()
                .vaccine(vaccine)
                .protocolName(protocolName)
                .totalDoses(totalDoses)
                .description("Phác đồ tiêm chuẩn theo khuyến cáo của nhà sản xuất")
                .build());

        for (int i = 0; i < doseRows.length; i++) {
            int[] row = doseRows[i];
            protocolDetailRepository.save(ProtocolDetail.builder()
                    .protocol(protocol)
                    .doseNumber(i + 1)
                    .intervalDays(row[2])
                    .ageFromMonths(row[0])
                    .ageToMonths(row[1] == 0 ? null : row[1])
                    .note("Mũi " + (i + 1))
                    .build());
        }
    }

    private void seedPrice(Vaccine vaccine, BigDecimal price) {
        priceListRepository.save(PriceList.builder()
                .vaccine(vaccine)
                .facility(null) // giá chung áp dụng cho tất cả cơ sở
                .price(price)
                .effectiveDate(LocalDate.now())
                .build());
    }

    /**
     * Seed dữ liệu kho (VaccineInventory + VaccineBatch) cho từng cơ sở tiêm chủng.
     * Cố tình dựng vài tình huống đặc biệt ở cơ sở đầu tiên để FE/QA có sẵn dữ liệu test:
     * - Lô sắp hết hạn trong 20 ngày tới -> demo API /inventory/alerts/expiring-soon
     * - Lô đã hết hạn nhưng còn đánh dấu AVAILABLE -> demo cơ chế auto-sync sang EXPIRED khi tra cứu
     * - 1 vắc xin cố tình để tồn kho thấp hơn alertThreshold mặc định (50) -> demo /inventory/alerts/low-stock
     */
    private void seedInventoryBatches() {
        if (vaccineInventoryRepository.count() > 0) {
            return;
        }

        List<VaccinationFacility> facilities = facilityRepository.findAll();
        List<Vaccine> vaccines = vaccineRepository.findAll();
        if (facilities.isEmpty() || vaccines.isEmpty()) {
            return; // seedFacilities()/seedVaccineCatalog() chưa có dữ liệu, bỏ qua an toàn
        }

        LocalDate today = LocalDate.now();

        for (int f = 0; f < facilities.size(); f++) {
            VaccinationFacility facility = facilities.get(f);
            VaccineInventory inventory = vaccineInventoryRepository.save(
                    VaccineInventory.builder().facility(facility).alertThreshold(50).build());

            for (int v = 0; v < vaccines.size(); v++) {
                Vaccine vaccine = vaccines.get(v);
                String batchPrefix = "LOT-" + facility.getFacilityId() + "-" + vaccine.getVaccineId();

                // Lô tiêu chuẩn: tồn kho dồi dào, còn hạn dài (18 tháng)
                seedBatch(inventory, vaccine, batchPrefix + "-A",
                        today.minusMonths(6), today.plusMonths(18), 100, 100,
                        new BigDecimal("50000"), today.minusDays(30), BatchStatus.AVAILABLE);

                // Chỉ tạo thêm tình huống đặc biệt ở CƠ SỞ ĐẦU TIÊN (facility[0]) để tránh seed dư thừa
                if (f == 0) {
                    if (v == 0) {
                        // Vắc xin đầu tiên: thêm 1 lô sắp hết hạn trong 20 ngày -> test cảnh báo expiring-soon
                        seedBatch(inventory, vaccine, batchPrefix + "-B",
                                today.minusMonths(11), today.plusDays(20), 15, 15,
                                new BigDecimal("50000"), today.minusDays(60), BatchStatus.AVAILABLE);
                    } else if (v == 1) {
                        // Vắc xin thứ 2: 1 lô ĐÃ hết hạn nhưng vẫn đang để AVAILABLE trong DB
                        // -> lần đầu gọi API tồn kho/cảnh báo sẽ tự động chuyển sang EXPIRED (demo auto-sync)
                        seedBatch(inventory, vaccine, batchPrefix + "-EXPIRED",
                                today.minusMonths(14), today.minusDays(5), 30, 30,
                                new BigDecimal("50000"), today.minusMonths(13), BatchStatus.AVAILABLE);
                    } else if (v == 2) {
                        // Vắc xin thứ 3: cố tình để tồn kho thấp (20 < alertThreshold mặc định 50)
                        seedBatch(inventory, vaccine, batchPrefix + "-LOW",
                                today.minusMonths(2), today.plusMonths(12), 20, 20,
                                new BigDecimal("50000"), today.minusDays(10), BatchStatus.AVAILABLE);
                    }
                }
            }
        }
    }

    private void seedBatch(VaccineInventory inventory, Vaccine vaccine, String batchNumber,
                            LocalDate manufactureDate, LocalDate expiryDate,
                            int importedQuantity, int stockQuantity,
                            BigDecimal importPrice, LocalDate importDate, BatchStatus status) {
        vaccineBatchRepository.save(VaccineBatch.builder()
                .inventory(inventory)
                .vaccine(vaccine)
                .batchNumber(batchNumber)
                .manufactureDate(manufactureDate)
                .expiryDate(expiryDate)
                .importedQuantity(importedQuantity)
                .stockQuantity(stockQuantity)
                .importPrice(importPrice)
                .importDate(importDate)
                .status(status)
                .build());
    }

    // ===================== SEED LỊCH SỬ APPOINTMENT + VACCINATION DETAIL (task 26/08) =====================

    /**
     * Sinh dữ liệu lịch sử {@value #HISTORY_WEEKS} tuần gần nhất (không đụng tới ngày hôm nay) cho Appointment +
     * Payment + VaccinationDetail, có pattern rõ theo THỨ TRONG TUẦN (cuối tuần/đầu tuần đông hơn) và theo
     * KHUNG GIỜ TRONG NGÀY (cao điểm sáng 8-10h, chiều 14-16h; thấp điểm giờ nghỉ trưa 11h30-13h30).
     * <p>
     * Đây là dữ liệu mà AiDispatchService (dự báo quá tải theo khung giờ) và AiForecastService (dự báo nhu cầu
     * vắc xin) cần có sẵn để AI Service có input huấn luyện/suy luận thực tế thay vì DB trống.
     */
    private void seedAppointmentHistory() {
        if (appointmentRepository.count() > 0) {
            return;
        }

        List<VaccinationFacility> facilities = facilityRepository.findAll();
        List<Vaccine> vaccines = vaccineRepository.findAll();
        List<User> patients = userRepository.findAll();
        if (facilities.isEmpty() || vaccines.isEmpty() || patients.isEmpty()) {
            return; // các seed nền tảng chưa chạy xong, bỏ qua an toàn (sẽ được gọi lại ở lần khởi động sau)
        }

        Map<Long, List<MedicalStaff>> staffByFacility = facilities.stream()
                .collect(Collectors.toMap(
                        VaccinationFacility::getFacilityId,
                        f -> medicalStaffRepository.findByFacility_FacilityId(f.getFacilityId())));

        Random random = new Random(RANDOM_SEED);

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusWeeks(HISTORY_WEEKS);
        LocalDate endDate = today.minusDays(1); // chỉ sinh dữ liệu quá khứ, không đụng vào khung giờ trống của "hôm nay"

        // Đếm số lịch đã xếp vào từng (facility, ngày, khung giờ) để không vượt capacityPerSlot của cơ sở
        Map<String, Integer> slotOccupancy = new HashMap<>();
        int certificateSeq = 1;
        int appointmentSeq = 1; // dùng để đảm bảo qrCode luôn unique tuyệt đối, không phụ thuộc xác suất UUID

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            double dayWeight = dayOfWeekWeight(date.getDayOfWeek());

            for (VaccinationFacility facility : facilities) {
                if (facility.getOpeningTime() == null || facility.getClosingTime() == null) {
                    continue;
                }

                // Trung bình 6 lịch hẹn/ngày ở mức dayWeight = 1.0, dao động ngẫu nhiên +-1 để dữ liệu không đều tăm tắp
                int baseAppointments = (int) Math.round(6 * dayWeight);
                int appointmentsToday = Math.max(0, baseAppointments + random.nextInt(3) - 1);

                for (int i = 0; i < appointmentsToday; i++) {
                    LocalTime timeSlot = pickWeightedTimeSlot(facility, random);
                    if (timeSlot == null) {
                        continue;
                    }

                    String slotKey = facility.getFacilityId() + "|" + date + "|" + timeSlot;
                    int occupied = slotOccupancy.getOrDefault(slotKey, 0);
                    int capacity = facility.getCapacityPerSlot() != null ? facility.getCapacityPerSlot() : 10;
                    if (occupied >= capacity) {
                        continue; // khung giờ đã đầy trong dữ liệu giả lập, bỏ qua lượt này
                    }
                    slotOccupancy.put(slotKey, occupied + 1);

                    User patient = patients.get(random.nextInt(patients.size()));
                    Vaccine vaccine = vaccines.get(random.nextInt(vaccines.size()));
                    List<MedicalStaff> staffList = staffByFacility.getOrDefault(facility.getFacilityId(), List.of());
                    MedicalStaff staff = staffList.isEmpty() ? null : staffList.get(random.nextInt(staffList.size()));

                    AppointmentStatus status = pickHistoricalStatus(random);
                    BigDecimal price = resolveSeedPrice(vaccine, facility);

                    String qrCode = "VX-HIST-" + facility.getFacilityId() + "-" + String.format("%06d", appointmentSeq++);

                    Appointment.AppointmentBuilder appointmentBuilder = Appointment.builder()
                            .user(patient)
                            .facility(facility)
                            .vaccine(vaccine)
                            .staff(status == AppointmentStatus.CANCELLED ? null : staff)
                            .price(price)
                            .appointmentDate(date)
                            .timeSlot(timeSlot)
                            .status(status)
                            .qrCode(qrCode);

                    if (status == AppointmentStatus.CANCELLED) {
                        appointmentBuilder
                                .cancelledAt(date.atTime(timeSlot).minusHours(1 + random.nextInt(48)))
                                .cancellationReason(pickCancelReason(random));
                    }

                    Appointment appointment = appointmentRepository.save(appointmentBuilder.build());

                    // Thanh toán: lịch KHÔNG bị hủy luôn có payment SUCCESS; lịch bị hủy thì 50% là hủy sau khi
                    // đã thanh toán (payment REFUNDED), 50% còn lại là hủy trước khi kịp thanh toán (không có payment)
                    boolean hasPayment = price != null
                            && (status != AppointmentStatus.CANCELLED || random.nextBoolean());
                    if (hasPayment) {
                        PaymentStatus paymentStatus = status == AppointmentStatus.CANCELLED
                                ? PaymentStatus.REFUNDED
                                : PaymentStatus.SUCCESS;
                        paymentRepository.save(Payment.builder()
                                .appointment(appointment)
                                .transactionId("HIST-TXN-" + appointment.getAppointmentId() + "-"
                                        + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase())
                                .amount(price)
                                .paymentMethod(random.nextBoolean() ? PaymentMethod.VNPAY : PaymentMethod.MOMO)
                                .status(paymentStatus)
                                .paymentTime(date.atTime(timeSlot).minusHours(1 + random.nextInt(24)))
                                .build());
                    }

                    if (status == AppointmentStatus.COMPLETED) {
                        VaccinationHistory history = vaccinationHistoryRepository.findByUser_UserId(patient.getUserId())
                                .orElseGet(() -> vaccinationHistoryRepository.save(
                                        VaccinationHistory.builder().user(patient).build()));

                        VaccinationResult result = pickVaccinationResult(random);
                        int doseNumber = (int) vaccinationDetailRepository
                                .countByHistory_HistoryIdAndVaccine_VaccineIdAndResultNot(
                                        history.getHistoryId(), vaccine.getVaccineId(), VaccinationResult.FAILED) + 1;

                        String certificateCode = result == VaccinationResult.SUCCESS
                                ? "VXC-CERT-HIST-" + String.format("%06d", certificateSeq++)
                                : null;

                        vaccinationDetailRepository.save(VaccinationDetail.builder()
                                .history(history)
                                .appointment(appointment)
                                .vaccine(vaccine)
                                // Không gắn batch/trừ kho thật cho dữ liệu lịch sử giả lập: các batch/tồn kho hiện tại
                                // được seedInventoryBatches() dựng riêng (kể cả các tình huống demo low-stock/expiring)
                                // và không nên bị dữ liệu lịch sử này làm lệch số liệu.
                                .batch(null)
                                .staff(staff)
                                .doseNumber(doseNumber)
                                .injectionDate(date)
                                .result(result)
                                .certificateCode(certificateCode)
                                .build());
                    }
                }
            }
        }
    }

    /** Chọn ngẫu nhiên 1 khung giờ trong giờ làm việc của cơ sở, có trọng số theo cao điểm/thấp điểm trong ngày. */
    private LocalTime pickWeightedTimeSlot(VaccinationFacility facility, Random random) {
        List<LocalTime> slots = new ArrayList<>();
        List<Double> weights = new ArrayList<>();
        LocalTime cursor = facility.getOpeningTime();
        while (cursor.isBefore(facility.getClosingTime())) {
            slots.add(cursor);
            weights.add(timeOfDayWeight(cursor));
            cursor = cursor.plusMinutes(SLOT_DURATION_MINUTES);
        }
        if (slots.isEmpty()) {
            return null;
        }

        double totalWeight = weights.stream().mapToDouble(Double::doubleValue).sum();
        double r = random.nextDouble() * totalWeight;
        double cumulative = 0;
        for (int i = 0; i < slots.size(); i++) {
            cumulative += weights.get(i);
            if (r <= cumulative) {
                return slots.get(i);
            }
        }
        return slots.get(slots.size() - 1);
    }

    /** Trọng số cao điểm/thấp điểm theo khung giờ: sáng 8-10h và chiều 14-16h đông nhất, nghỉ trưa 11h30-13h30 vắng nhất. */
    private double timeOfDayWeight(LocalTime time) {
        int minutesFromMidnight = time.getHour() * 60 + time.getMinute();
        if (minutesFromMidnight >= 8 * 60 && minutesFromMidnight < 10 * 60) {
            return 3.0;
        }
        if (minutesFromMidnight >= 14 * 60 && minutesFromMidnight < 16 * 60) {
            return 2.5;
        }
        if (minutesFromMidnight >= 11 * 60 + 30 && minutesFromMidnight < 13 * 60 + 30) {
            return 0.5;
        }
        if (minutesFromMidnight >= 16 * 60 + 30) {
            return 0.7;
        }
        return 1.5;
    }

    /** Trọng số theo thứ trong tuần: Thứ 7 đông nhất, Chủ nhật và Thứ 2 (dồn từ cuối tuần) đông vừa. */
    private double dayOfWeekWeight(DayOfWeek dow) {
        return switch (dow) {
            case SATURDAY -> 1.8;
            case SUNDAY -> 1.4;
            case MONDAY -> 1.3;
            case FRIDAY -> 1.1;
            default -> 1.0;
        };
    }

    /** Phân bố trạng thái lịch hẹn trong quá khứ: đa số hoàn tất, một phần bị hủy hoặc không đến. */
    private AppointmentStatus pickHistoricalStatus(Random random) {
        double r = random.nextDouble();
        if (r < 0.80) {
            return AppointmentStatus.COMPLETED;
        }
        if (r < 0.90) {
            return AppointmentStatus.CANCELLED;
        }
        return AppointmentStatus.NO_SHOW;
    }

    /** Phân bố kết quả tiêm: đa số thành công, một ít PARTIAL/FAILED để dữ liệu thực tế hơn. */
    private VaccinationResult pickVaccinationResult(Random random) {
        double r = random.nextDouble();
        if (r < 0.93) {
            return VaccinationResult.SUCCESS;
        }
        if (r < 0.98) {
            return VaccinationResult.PARTIAL;
        }
        return VaccinationResult.FAILED;
    }

    private static final List<String> CANCEL_REASONS = List.of(
            "Người dùng bận việc đột xuất",
            "Trẻ bị sốt nhẹ, hoãn lịch tiêm",
            "Đổi sang cơ sở khác gần nhà hơn",
            "Không còn nhu cầu tiêm mũi này"
    );

    private String pickCancelReason(Random random) {
        return CANCEL_REASONS.get(random.nextInt(CANCEL_REASONS.size()));
    }

    /** Lấy giá vắc xin đang ACTIVE (ưu tiên giá riêng theo cơ sở, không thì lấy giá chung) để gán cho lịch sử. */
    private BigDecimal resolveSeedPrice(Vaccine vaccine, VaccinationFacility facility) {
        List<PriceList> prices = priceListRepository.findByVaccine_VaccineIdAndStatus(
                vaccine.getVaccineId(), ActiveStatus.ACTIVE);
        return prices.stream()
                .filter(p -> p.getFacility() == null
                        || p.getFacility().getFacilityId().equals(facility.getFacilityId()))
                .findFirst()
                .map(PriceList::getPrice)
                .orElse(null);
    }
}