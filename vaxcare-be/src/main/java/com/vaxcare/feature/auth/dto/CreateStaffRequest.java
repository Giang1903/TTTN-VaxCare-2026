package com.vaxcare.feature.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateStaffRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6, max = 100)
    private String password;
    private String phone;
    @NotBlank
    private String fullName;
    @NotBlank
    private String staffCode;
    private String specialty;
    @NotNull
    private Long facilityId;
}