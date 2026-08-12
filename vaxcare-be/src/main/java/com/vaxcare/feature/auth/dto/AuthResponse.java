package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private Long accountId;
    private String email;
    private String fullName;
    private Role role;
}
