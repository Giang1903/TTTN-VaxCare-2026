package com.vaxcare.feature.dashboard.dto;

import com.vaxcare.common.enums.ReactionSeverity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionSeverityCount {
    private ReactionSeverity severity;
    private long count;
}
