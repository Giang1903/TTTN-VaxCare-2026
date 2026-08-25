
package com.vaxcare.feature.system.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfigResponse {
    private String key;
    private String value;
    private String description;
    private LocalDateTime updatedAt;
}