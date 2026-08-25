package com.vaxcare.feature.auth.service;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.dto.AdminAccountItemResponse;
import com.vaxcare.feature.auth.dto.CreateStaffRequest;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.feature.dashboard.service.AuditLogWriter;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private final AccountRepository accountRepository;
    private final MedicalStaffRepository medicalStaffRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogWriter auditLogWriter;

    @Transactional(readOnly = true)
    public List<AdminAccountItemResponse> listByRole(Role role) {
        return accountRepository.findByRoleWithDetails(role).stream()
                .map(this::map)
                .toList();
    }

    @Transactional
    public AdminAccountItemResponse updateStatus(Long accountId, AccountStatus status) {
        if (status == null) {
            throw new BadRequestException("status không được để trống");
        }
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản ID: " + accountId));
        String old = String.valueOf(account.getStatus());
        account.setStatus(status);
        Account saved = accountRepository.save(account);
        auditLogWriter.write("UPDATE_ACCOUNT_STATUS", "USER", accountId, old, String.valueOf(status));
        return map(saved);
    }

    @Transactional
    public AdminAccountItemResponse createStaff(CreateStaffRequest req) {
        if (accountRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (medicalStaffRepository.findByStaffCode(req.getStaffCode()).isPresent()) {
            throw new BadRequestException("Mã nhân viên đã tồn tại");
        }
        VaccinationFacility facility = facilityRepository.findById(req.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở ID: " + req.getFacilityId()));

        Account account = Account.builder()
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(Role.MEDICAL_STAFF)
                .status(AccountStatus.ACTIVE)
                .build();

        MedicalStaff staff = MedicalStaff.builder()
                .account(account)
                .fullName(req.getFullName().trim())
                .staffCode(req.getStaffCode().trim())
                .specialty(req.getSpecialty())
                .facility(facility)
                .build();
        account.setMedicalStaff(staff);

        Account saved = accountRepository.save(account);
        auditLogWriter.write("CREATE_STAFF", "USER", saved.getAccountId(), null,
                req.getEmail() + " / " + req.getStaffCode());
        return map(accountRepository.findByRoleWithDetails(Role.MEDICAL_STAFF).stream()
                .filter(a -> a.getAccountId().equals(saved.getAccountId()))
                .findFirst()
                .orElse(saved));
    }

    private AdminAccountItemResponse map(Account a) {
        AdminAccountItemResponse.AdminAccountItemResponseBuilder b = AdminAccountItemResponse.builder()
                .accountId(a.getAccountId())
                .email(a.getEmail())
                .phone(a.getPhone())
                .role(a.getRole())
                .status(a.getStatus())
                .avatarUrl(a.getAvatarUrl())
                .createdAt(a.getCreatedAt());

        if (a.getRole() == Role.USER && a.getUser() != null) {
            User u = a.getUser();
            b.fullName(u.getFullName())
                    .gender(u.getGender())
                    .dateOfBirth(u.getDateOfBirth())
                    .address(u.getAddress());
        } else if (a.getRole() == Role.MEDICAL_STAFF && a.getMedicalStaff() != null) {
            MedicalStaff s = a.getMedicalStaff();
            b.fullName(s.getFullName())
                    .staffCode(s.getStaffCode())
                    .specialty(s.getSpecialty());
            if (s.getFacility() != null) {
                b.facilityId(s.getFacility().getFacilityId())
                        .facilityName(s.getFacility().getFacilityName());
            }
        } else if (a.getRole() == Role.ADMIN && a.getAdmin() != null) {
            b.fullName(a.getAdmin().getFullName());
        }
        return b.build();
    }
}