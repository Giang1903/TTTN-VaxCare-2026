package com.vaxcare.feature.reaction.dto;

import com.vaxcare.common.enums.ReactionSeverity;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitReactionRequest {

    @NotNull(message = "ID mũi tiêm không được để trống")
    private Long detailId;

    @NotNull(message = "Mức độ phản ứng không được để trống")
    private ReactionSeverity severity;

    private String symptoms;
}
