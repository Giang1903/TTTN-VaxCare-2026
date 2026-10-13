package com.vaxcare.feature.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    @NotNull(message = "recipientId is required")
    private Long recipientId;

    @NotBlank(message = "content is required")
    @Size(max = 4000, message = "content max 4000 characters")
    private String content;
}
