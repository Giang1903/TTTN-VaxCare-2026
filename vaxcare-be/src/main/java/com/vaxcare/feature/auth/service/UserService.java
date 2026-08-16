package com.vaxcare.feature.auth.service;

import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.dto.UserProfileRequest;
import com.vaxcare.feature.auth.dto.UserProfileResponse;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.HealthProfile;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .userId(account.getAccountId())
                .email(account.getEmail())
                .phone(account.getPhone())
                .avatarUrl(account.getAvatarUrl());

        if (account.getRole() == Role.USER && account.getUser() != null) {
            User user = account.getUser();
            builder.fullName(user.getFullName())
                    .dateOfBirth(user.getDateOfBirth())
                    .gender(user.getGender())
                    .address(user.getAddress());

            if (user.getHealthProfile() != null) {
                HealthProfile hp = user.getHealthProfile();
                builder.height(hp.getHeight())
                        .weight(hp.getWeight())
                        .medicalHistory(hp.getMedicalHistory())
                        .allergies(hp.getAllergies())
                        .healthNote(hp.getNote());
            }
        } else if (account.getRole() == Role.ADMIN && account.getAdmin() != null) {
            builder.fullName(account.getAdmin().getFullName());
        } else if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            builder.fullName(account.getMedicalStaff().getFullName());
        }

        return builder.build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UserProfileRequest request) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

        if (request.getPhone() != null) {
            account.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            account.setAvatarUrl(request.getAvatarUrl());
        }

        if (account.getRole() == Role.USER && account.getUser() != null) {
            User user = account.getUser();
            if (request.getFullName() != null) {
                user.setFullName(request.getFullName());
            }
            if (request.getDateOfBirth() != null) {
                user.setDateOfBirth(request.getDateOfBirth());
            }
            if (request.getGender() != null) {
                user.setGender(request.getGender());
            }
            if (request.getAddress() != null) {
                user.setAddress(request.getAddress());
            }
        } else if (account.getRole() == Role.ADMIN && account.getAdmin() != null) {
            if (request.getFullName() != null) {
                account.getAdmin().setFullName(request.getFullName());
            }
        } else if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            if (request.getFullName() != null) {
                account.getMedicalStaff().setFullName(request.getFullName());
            }
        }

        accountRepository.save(account);
        return getProfile(userId);
    }
}
