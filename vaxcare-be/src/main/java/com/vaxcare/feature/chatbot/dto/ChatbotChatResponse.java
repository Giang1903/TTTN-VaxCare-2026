package com.vaxcare.feature.chatbot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotChatResponse {

    private String reply;
    private String intent;

    @JsonProperty("intent_confidence")
    private Double intentConfidence;

    @Builder.Default
    private List<ChatbotSourceDto> sources = new ArrayList<>();

    @Builder.Default
    private List<ChatbotActionDto> actions = new ArrayList<>();

    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("safe_mode")
    private Boolean safeMode;

    @Builder.Default
    private Map<String, Object> meta = new HashMap<>();
}
