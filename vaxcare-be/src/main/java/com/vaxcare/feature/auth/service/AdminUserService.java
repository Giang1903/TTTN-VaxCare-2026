package com.vaxcare.feature.auth.service;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.dto.*;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.Admin;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.auth.repository.AdminRepository;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminUserService {

    private final AccountRepository accountRepository;
    private final MedicalStaffRepository medicalStaffRepository;
    private final AdminRepository adminRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;

    // ===================== TÌM KIẾM / XEM CHI TIẾT =====================

    @Transactional(readOnly = true)
    public List<AccountResponse> searchUsers(Role role, AccountStatus status, String keyword) {
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return accountRepository.searchAccounts(role, status, normalizedKeyword).stream()
                .map(this::mapToAccountResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminAccountDetailResponse getUserDetail(Long accountId) {
        Account account = findAccountWithProfilesOrThrow(accountId);
        return mapToDetailResponse(account);
    }

    // ===================== KHÓA / MỞ KHÓA TÀI KHOẢN =====================

    @Transactional
    public AccountResponse updateAccountStatus(Long accountId, Long currentAccountId, AccountStatus newStatus) {
        if (accountId.equals(currentAccountId) && newStatus != AccountStatus.ACTIVE) {
            throw new BadRequestException("Bạn không thể tự khóa/vô hiệu hóa chính tài khoản đang đăng nhập");
        }
        Account account = findAccountOrThrow(accountId);
        if (account.getStatus() == AccountStatus.DELETED) {
            throw new BadRequestException("Tài khoản đã bị xóa, không thể thay đổi trạng thái");
        }

        account.setStatus(newStatus);
        return mapToAccountResponse(accountRepository.save(account));
    }

    // ===================== TẠO TÀI KHOẢN NHÂN VIÊN Y TẾ =====================

    @Transactional
    public AccountResponse createStaffAccount(CreateStaffAccountRequest request) {
        validateEmailNotUsed(request.getEmail());
        if (medicalStaffRepository.existsByStaffCode(request.getStaffCode())) {
            throw new BadRequestException("Mã nhân viên (staffCode) đã tồn tại: " + request.getStaffCode());
        }
        VaccinationFacility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy cơ sở tiêm chủng với ID: " + request.getFacilityId()));

        Account account = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.MEDICAL_STAFF)
                .status(AccountStatus.ACTIVE)
                .build();

        MedicalStaff staff = MedicalStaff.builder()
                .account(account)
                .fullName(request.getFullName())
                .staffCode(request.getStaffCode())
                .specialty(request.getSpecialty())
                .facility(facility)
                .build();

        account.setMedicalStaff(staff);
        Account saved = accountRepository.save(account);
        return mapToAccountResponse(saved);
    }

    @Transactional
    public AdminAccountDetailResponse updateStaffFacility(Long staffId, Long newFacilityId) {
        MedicalStaff staff = medicalStaffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên y tế với ID: " + staffId));
        VaccinationFacility facility = facilityRepository.findById(newFacilityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy cơ sở tiêm chủng với ID: " + newFacilityId));

        staff.setFacility(facility);
        medicalStaffRepository.save(staff);

        return mapToDetailResponse(findAccountWithProfilesOrThrow(staffId));
    }

    // ===================== TẠO TÀI KHOẢN ADMIN =====================

    @Transactional
    public AccountResponse createAdminAccount(CreateAdminAccountRequest request) {
        validateEmailNotUsed(request.getEmail());

        Account account = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.ADMIN)
                .status(AccountStatus.ACTIVE)
                .build();

        Admin admin = Admin.builder()
                .account(account)
                .fullName(request.getFullName())
                .adminLevel(request.getAdminLevel() != null && !request.getAdminLevel().isBlank()
                        ? request.getAdminLevel() : "SYSTEM")
                .build();

        account.setAdmin(admin);
        Account saved = accountRepository.save(account);
        return mapToAccountResponse(saved);
    }

    // ===================== HELPERS =====================

    private void validateEmailNotUsed(String email) {
        if (accountRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được sử dụng: " + email);
        }
    }

    private Account findAccountOrThrow(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
    }

    private Account findAccountWithProfilesOrThrow(Long accountId) {
        return accountRepository.findByIdWithProfiles(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
    }

    private String resolveFullName(Account account) {
        if (account.getUser() != null) return account.getUser().getFullName();
        if (account.getMedicalStaff() != null) return account.getMedicalStaff().getFullName();
        if (account.getAdmin() != null) return account.getAdmin().getFullName();
        return null;
    }

    private AccountResponse mapToAccountResponse(Account account) {
        return AccountResponse.builder()
                .accountId(account.getAccountId())
                .email(account.getEmail())
                .phone(account.getPhone())
                .role(account.getRole())
                .status(account.getStatus())
                .avatarUrl(account.getAvatarUrl())
                .fullName(resolveFullName(account))
                .createdAt(account.getCreatedAt())
                .build();
    }

    private AdminAccountDetailResponse mapToDetailResponse(Account account) {
        AdminAccountDetailResponse.AdminAccountDetailResponseBuilder builder = AdminAccountDetailResponse.builder()
                .accountId(account.getAccountId())
                .email(account.getEmail())
                .phone(account.getPhone())
                .role(account.getRole())
                .status(account.getStatus())
                .avatarUrl(account.getAvatarUrl())
                .fullName(resolveFullName(account))
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt());

        if (account.getUser() != null) {
            builder.dateOfBirth(account.getUser().getDateOfBirth())
                    .gender(account.getUser().getGender())
                    .address(account.getUser().getAddress());
        }
        if (account.getMedicalStaff() != null) {
            MedicalStaff staff = account.getMedicalStaff();
            builder.staffCode(staff.getStaffCode())
                    .specialty(staff.getSpecialty())
                    .facilityId(staff.getFacility() != null ? staff.getFacility().getFacilityId() : null)
                    .facilityName(staff.getFacility() != null ? staff.getFacility().getFacilityName() : null);
        }
        if (account.getAdmin() != null) {
            builder.adminLevel(account.getAdmin().getAdminLevel());
        }

        return builder.build();
    }
}
