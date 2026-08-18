package com.vaxcare.config;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.Admin;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedFacilities();
        seedAccounts();
        seedVaccineCatalog();
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

        VaccinationFacility facility = facilityRepository.findAll().stream().findFirst()
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
}
