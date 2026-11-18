package com.vaxcare.feature.chatbot.repository;

import com.vaxcare.feature.chatbot.entity.ChatbotMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {

    Page<ChatbotMessage> findBySession_SessionKeyOrderByCreatedAtAsc(String sessionKey, Pageable pageable);
}
