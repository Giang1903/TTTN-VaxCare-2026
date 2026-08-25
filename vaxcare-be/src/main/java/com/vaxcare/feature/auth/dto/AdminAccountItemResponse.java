package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Gender;
import com.vaxcare.common.enums.Role;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAccountItemResponse {
    private Long accountId;
    private String email;
    private String phone;
    private Role role;
    private AccountStatus status;
    private String fullName;
    private String avatarUrl;
    private LocalDateTime createdAt;

    // USER
    private Gender gender;
    private LocalDate dateOfBirth;
    private String address;

    // MEDICAL_STAFF
    private String staffCode;
    private String specialty;
    private Long facilityId;
    private String facilityName;
}