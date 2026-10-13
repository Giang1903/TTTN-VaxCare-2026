package com.vaxcare.feature.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.vaxcare.feature.chat.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long messageId;
    private Long senderId;
    private String senderEmail;
    private Long recipientId;
    private String recipientEmail;
    private String content;
    private Boolean isRead;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime readAt;

    public static ChatMessageResponse from(ChatMessage m) {
        return ChatMessageResponse.builder()
                .messageId(m.getMessageId())
                .senderId(m.getSender().getAccountId())
                .senderEmail(m.getSender().getEmail())
                .recipientId(m.getRecipient().getAccountId())
                .recipientEmail(m.getRecipient().getEmail())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .sentAt(m.getSentAt())
                .readAt(m.getReadAt())
                .build();
    }
}
