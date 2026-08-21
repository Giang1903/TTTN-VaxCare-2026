package com.vaxcare.feature.auth.service;

import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.auth.dto.HealthProfileRequest;
import com.vaxcare.feature.auth.dto.HealthProfileResponse;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.HealthProfile;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.auth.repository.HealthProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class HealthProfileService {

    private final HealthProfileRepository healthProfileRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public HealthProfileResponse getProfileByUserId(Long userId) {
        HealthProfile healthProfile = healthProfileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sức khỏe của người dùng có ID: " + userId));
        return mapToResponse(healthProfile);
    }

    @Transactional(readOnly = true)
    public HealthProfileResponse getProfileById(Long profileId, Long currentUserId) {
        HealthProfile healthProfile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sức khỏe có ID: " + profileId));

        Account account = accountRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentUserId));

        if (!healthProfile.getUser().getUserId().equals(currentUserId) && account.getRole().name().equals("USER")) {
            throw new UnauthorizedException("Bạn không có quyền truy cập hồ sơ sức khỏe này!");
        }

        return mapToResponse(healthProfile);
    }

    @Transactional
    public HealthProfileResponse createProfile(Long userId, HealthProfileRequest request) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

        if (account.getUser() == null) {
            throw new BadRequestException("Tài khoản này không phải tài khoản khách hàng để có hồ sơ sức khỏe!");
        }

        if (healthProfileRepository.findByUser_UserId(userId).isPresent()) {
            throw new BadRequestException("Hồ sơ sức khỏe của bạn đã tồn tại!");
        }

        User user = account.getUser();
        HealthProfile healthProfile = HealthProfile.builder()
                .user(user)
                .height(request.getHeight())
                .weight(request.getWeight())
                .medicalHistory(request.getMedicalHistory())
                .allergies(request.getAllergies())
                .note(request.getNote())
                .build();

        HealthProfile savedProfile = healthProfileRepository.save(healthProfile);
        return mapToResponse(savedProfile);
    }

    @Transactional
    public HealthProfileResponse updateProfile(Long profileId, Long currentUserId, HealthProfileRequest request) {
        HealthProfile healthProfile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sức khỏe có ID: " + profileId));

        Account account = accountRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentUserId));

        if (!healthProfile.getUser().getUserId().equals(currentUserId) && account.getRole().name().equals("USER")) {
            throw new UnauthorizedException("Bạn không có quyền chỉnh sửa hồ sơ sức khỏe này!");
        }

        if (request.getHeight() != null) {
            healthProfile.setHeight(request.getHeight());
        }
        if (request.getWeight() != null) {
            healthProfile.setWeight(request.getWeight());
        }
        if (request.getMedicalHistory() != null) {
            healthProfile.setMedicalHistory(request.getMedicalHistory());
        }
        if (request.getAllergies() != null) {
            healthProfile.setAllergies(request.getAllergies());
        }
        if (request.getNote() != null) {
            healthProfile.setNote(request.getNote());
        }

        HealthProfile updatedProfile = healthProfileRepository.save(healthProfile);
        return mapToResponse(updatedProfile);
    }

    @Transactional
    public void deleteProfile(Long profileId, Long currentUserId) {
        HealthProfile healthProfile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sức khỏe có ID: " + profileId));

        Account account = accountRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentUserId));

        if (!healthProfile.getUser().getUserId().equals(currentUserId) && account.getRole().name().equals("USER")) {
            throw new UnauthorizedException("Bạn không có quyền xóa hồ sơ sức khỏe này!");
        }

        User user = healthProfile.getUser();
        if (user != null) {
            user.setHealthProfile(null);
        }

        healthProfileRepository.delete(healthProfile);
    }

    private HealthProfileResponse mapToResponse(HealthProfile healthProfile) {
        return HealthProfileResponse.builder()
                .profileId(healthProfile.getProfileId())
                .userId(healthProfile.getUser().getUserId())
                .userFullName(healthProfile.getUser().getFullName())
                .height(healthProfile.getHeight())
                .weight(healthProfile.getWeight())
                .medicalHistory(healthProfile.getMedicalHistory())
                .allergies(healthProfile.getAllergies())
                .note(healthProfile.getNote())
                .updatedAt(healthProfile.getUpdatedAt())
                .build();
    }
}
