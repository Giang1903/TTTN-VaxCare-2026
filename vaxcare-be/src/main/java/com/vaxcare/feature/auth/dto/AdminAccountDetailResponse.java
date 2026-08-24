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
public class AdminAccountDetailResponse {

    private Long accountId;
    private String email;
    private String phone;
    private Role role;
    private AccountStatus status;
    private String avatarUrl;
    private String fullName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private String staffCode;
    private String specialty;
    private Long facilityId;
    private String facilityName;
    private String adminLevel;
}
