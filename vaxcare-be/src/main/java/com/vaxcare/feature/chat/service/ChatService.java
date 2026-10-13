package com.vaxcare.feature.chat.service;

import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.chat.dto.ChatMessageRequest;
import com.vaxcare.feature.chat.dto.ChatMessageResponse;
import com.vaxcare.feature.chat.dto.ConversationSummaryResponse;
import com.vaxcare.feature.chat.entity.ChatMessage;
import com.vaxcare.feature.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")

public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final AccountRepository accountRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {
        if (senderId.equals(request.getRecipientId())) {
            throw new BadRequestException("Không thể gửi tin nhắn cho chính mình");
        }

        Account sender = accountRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        Account recipient = accountRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found: " + request.getRecipientId()));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.from(message);

        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/queue/messages",
                response
        );
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/messages",
                response
        );

        log.debug("Chat message {} sent from {} to {}", message.getMessageId(), senderId, recipient.getAccountId());
        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getConversationHistory(Long currentUserId, Long partnerId, int page, int size) {
        if (!accountRepository.existsById(partnerId)) {
            throw new ResourceNotFoundException("Partner not found: " + partnerId);
        }
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findConversation(currentUserId, partnerId, pageable)
                .map(ChatMessageResponse::from);
    }

    @Transactional
    public ChatMessageResponse markAsRead(Long messageId, Long currentUserId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        if (!message.getRecipient().getAccountId().equals(currentUserId)) {
            throw new BadRequestException("Chỉ người nhận mới được đánh dấu đã đọc");
        }

        if (Boolean.TRUE.equals(message.getIsRead())) {
            return ChatMessageResponse.from(message);
        }

        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        message = chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.from(message);

        messagingTemplate.convertAndSendToUser(
                message.getSender().getEmail(),
                "/queue/messages/read",
                response
        );

        return response;
    }

    @Transactional
    public int markConversationAsRead(Long currentUserId, Long partnerId) {
        int updated = chatMessageRepository.markConversationAsRead(
                currentUserId, partnerId, LocalDateTime.now());
        log.debug("Marked {} messages as read for user {} from partner {}", updated, currentUserId, partnerId);
        return updated;
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return chatMessageRepository.countByRecipientAccountIdAndIsReadFalse(userId);
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> getConversations(Long userId) {
        List<Long> partnerIds = chatMessageRepository.findPartnerIds(userId);
        List<ConversationSummaryResponse> result = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            Account partner = accountRepository.findByIdWithProfiles(partnerId).orElse(null);
            if (partner == null) continue;

            Page<ChatMessage> lastPage = chatMessageRepository.findConversation(
                    userId, partnerId, PageRequest.of(0, 1));
            if (lastPage.isEmpty()) continue;

            ChatMessage last = lastPage.getContent().get(0);
            long unread = chatMessageRepository.countUnreadFromPartner(userId, partnerId);

            String partnerName = resolveDisplayName(partner);

            result.add(ConversationSummaryResponse.builder()
                    .partnerId(partnerId)
                    .partnerEmail(partner.getEmail())
                    .partnerName(partnerName)
                    .lastMessage(last.getContent())
                    .lastMessageIsRead(last.getIsRead())
                    .lastMessageAt(last.getSentAt())
                    .unreadCount(unread)
                    .build());
        }
        return result;
    }

    private String resolveDisplayName(Account account) {
        if (account.getUser() != null && account.getUser().getFullName() != null) {
            return account.getUser().getFullName();
        }
        if (account.getMedicalStaff() != null && account.getMedicalStaff().getFullName() != null) {
            return account.getMedicalStaff().getFullName();
        }
        if (account.getAdmin() != null && account.getAdmin().getFullName() != null) {
            return account.getAdmin().getFullName();
        }
        return account.getEmail();
    }
}
