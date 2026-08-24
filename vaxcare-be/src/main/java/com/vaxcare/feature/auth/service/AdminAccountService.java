package com.vaxcare.feature.auth.service;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.dto.AdminAccountItemResponse;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private final AccountRepository accountRepository;

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
        account.setStatus(status);
        return map(accountRepository.save(account));
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