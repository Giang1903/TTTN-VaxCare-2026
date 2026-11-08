package com.vaxcare.feature.chatbot.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
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
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AiChatResponseDto {
    private String reply;
    private String intent;
    private Double intentConfidence;
    @Builder.Default
    private List<ChatbotSourceDto> sources = new ArrayList<>();
    @Builder.Default
    private List<ChatbotActionDto> actions = new ArrayList<>();
    private String sessionId;
    private Boolean safeMode;
    @Builder.Default
    private Map<String, Object> meta = new HashMap<>();
}
