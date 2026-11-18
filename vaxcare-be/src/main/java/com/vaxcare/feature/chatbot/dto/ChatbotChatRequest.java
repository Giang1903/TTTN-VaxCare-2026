package com.vaxcare.feature.chatbot.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotChatRequest {

    @NotBlank
    @Size(max = 2000)
    private String message;

    @JsonAlias({"session_id"})
    private String sessionId;

    private Map<String, Object> context;
}
