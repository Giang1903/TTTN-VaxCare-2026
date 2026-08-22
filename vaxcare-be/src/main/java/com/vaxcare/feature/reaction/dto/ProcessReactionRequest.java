package com.vaxcare.feature.reaction.dto;

import com.vaxcare.common.enums.ReactionProcessingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessReactionRequest {

    @NotNull(message = "Trạng thái xử lý không được để trống")
    private ReactionProcessingStatus processingStatus;

    private String staffNote;
}
