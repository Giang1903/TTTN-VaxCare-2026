package com.vaxcare.feature.auth.dto;

import com.vaxcare.common.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAccountStatusRequest {

    @NotNull(message = "status không được để trống")
    private AccountStatus status;
}
