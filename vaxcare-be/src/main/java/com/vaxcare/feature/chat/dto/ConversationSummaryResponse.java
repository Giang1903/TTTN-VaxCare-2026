package com.vaxcare.feature.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryResponse {

    private Long partnerId;
    private String partnerEmail;
    private String partnerName;
    private String lastMessage;
    private Boolean lastMessageIsRead;
    private Long unreadCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastMessageAt;
}
