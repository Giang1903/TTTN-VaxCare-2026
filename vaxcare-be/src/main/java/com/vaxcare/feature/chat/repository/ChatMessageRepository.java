package com.vaxcare.feature.chat.repository;

import com.vaxcare.feature.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT m FROM ChatMessage m
        JOIN FETCH m.sender
        JOIN FETCH m.recipient
        WHERE (m.sender.accountId = :userId1 AND m.recipient.accountId = :userId2)
           OR (m.sender.accountId = :userId2 AND m.recipient.accountId = :userId1)
        ORDER BY m.sentAt DESC
        """)
    Page<ChatMessage> findConversation(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            Pageable pageable);

    @Query(value = """
        SELECT DISTINCT CASE
            WHEN m.sender_id = :userId THEN m.recipient_id
            ELSE m.sender_id
        END AS partner_id
        FROM chat_messages m
        WHERE m.sender_id = :userId OR m.recipient_id = :userId
        ORDER BY (
            SELECT MAX(m2.sent_at) FROM chat_messages m2
            WHERE (m2.sender_id = :userId AND m2.recipient_id = partner_id)
               OR (m2.recipient_id = :userId AND m2.sender_id = partner_id)
        ) DESC
        """, nativeQuery = true)
    List<Long> findPartnerIds(@Param("userId") Long userId);

    long countByRecipientAccountIdAndIsReadFalse(Long recipientId);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.recipient.accountId = :recipientId
          AND m.sender.accountId = :senderId
          AND m.isRead = false
        """)
    long countUnreadFromPartner(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId);

    @Modifying
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true, m.readAt = :readAt
        WHERE m.recipient.accountId = :recipientId
          AND m.sender.accountId = :senderId
          AND m.isRead = false
        """)
    int markConversationAsRead(
            @Param("recipientId") Long recipientId,
            @Param("senderId") Long senderId,
            @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true, m.readAt = :readAt
        WHERE m.messageId = :messageId
          AND m.recipient.accountId = :recipientId
          AND m.isRead = false
        """)
    int markMessageAsRead(
            @Param("messageId") Long messageId,
            @Param("recipientId") Long recipientId,
            @Param("readAt") LocalDateTime readAt);
}
