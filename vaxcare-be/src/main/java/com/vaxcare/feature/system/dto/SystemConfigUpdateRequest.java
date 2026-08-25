
package com.vaxcare.feature.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfigUpdateRequest {
    @NotBlank
    private String key;
    private String value;
    private String description;
}