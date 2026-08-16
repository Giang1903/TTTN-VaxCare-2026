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
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedFacilities();
        seedAccounts();
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
}
