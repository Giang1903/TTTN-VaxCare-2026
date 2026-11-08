package com.vaxcare.feature.chatbot.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_messages", indexes = {
        @Index(name = "idx_chatbot_msg_session", columnList = "session_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatbotSession session;

    @Column(name = "role", nullable = false, length = 16)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 64)
    private String intent;

    @Column(name = "intent_confidence")
    private Double intentConfidence;

    @Column(name = "safe_mode")
    private Boolean safeMode;

    @Column(name = "meta_json", columnDefinition = "TEXT")
    private String metaJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
