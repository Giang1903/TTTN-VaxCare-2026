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
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new BadRequestException("Email không được để trống");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new BadRequestException("Họ tên không được để trống");
        }
        if (req.getStaffCode() == null || req.getStaffCode().isBlank()) {
            throw new BadRequestException("Mã nhân viên không được để trống");
        }
        if (req.getFacilityId() == null) {
            throw new BadRequestException("facilityId không được để trống");
        }
        String email = req.getEmail().trim().toLowerCase();
        String staffCode = req.getStaffCode().trim();
        if (accountRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (medicalStaffRepository.existsByStaffCode(staffCode)
                || medicalStaffRepository.findByStaffCode(staffCode).isPresent()) {
            throw new BadRequestException("Mã nhân viên đã tồn tại");
        }
        VaccinationFacility facility = facilityRepository.findById(req.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở ID: " + req.getFacilityId()));

        Account account = Account.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone() != null && !req.getPhone().isBlank() ? req.getPhone().trim() : null)
                .role(Role.MEDICAL_STAFF)
                .status(AccountStatus.ACTIVE)
                .build();

        MedicalStaff staff = MedicalStaff.builder()
                .account(account)
                .fullName(req.getFullName().trim())
                .staffCode(staffCode)
                .specialty(req.getSpecialty() != null && !req.getSpecialty().isBlank()
                        ? req.getSpecialty().trim() : null)
                .facility(facility)
                .build();
        account.setMedicalStaff(staff);

        Account saved = accountRepository.save(account);
        accountRepository.flush();

        // Audit tách transaction — lỗi audit không được làm fail tạo staff
        try {
            auditLogWriter.write(
                    "CREATE_STAFF",
                    "USER",
                    saved.getAccountId(),
                    null,
                    email + " / " + staffCode);
        } catch (Exception ignored) {
            // ignore
        }
        return map(saved);
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

    @Transactional
    public void setPassword(Long accountId, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản ID: " + accountId));
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        // hủy token reset nếu có
        account.setPasswordResetToken(null);
        account.setPasswordResetTokenExpiresAt(null);
        accountRepository.save(account);
        auditLogWriter.write("SET_PASSWORD", "ACCOUNT", accountId, null, "admin_set");
    }

}