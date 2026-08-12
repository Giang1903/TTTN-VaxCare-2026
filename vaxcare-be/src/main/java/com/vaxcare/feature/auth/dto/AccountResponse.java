package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {

    private Long accountId;
    private String email;
    private String phone;
    private Role role;
    private AccountStatus status;
    private String avatarUrl;
    private String fullName;
    private LocalDateTime createdAt;
}
