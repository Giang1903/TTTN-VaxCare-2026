package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.Gender;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long userId;
    private String email;
    private String phone;
    private String fullName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private String avatarUrl;

    // Health profile
    private BigDecimal height;
    private BigDecimal weight;
    private String medicalHistory;
    private String allergies;
    private String healthNote;
}
