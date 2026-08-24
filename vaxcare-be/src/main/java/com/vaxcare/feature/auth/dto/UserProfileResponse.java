
package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.Gender;
import com.vaxcare.common.enums.Role;
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
    private Role role;

    // Health profile (USER)
    private BigDecimal height;
    private BigDecimal weight;
    private String medicalHistory;
    private String allergies;
    private String healthNote;

    // Medical staff fields
    private Long facilityId;
    private String facilityName;
    private String staffCode;
    private String specialty;
}