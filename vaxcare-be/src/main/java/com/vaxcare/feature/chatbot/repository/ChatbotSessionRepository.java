package com.vaxcare.feature.chatbot.repository;

import com.vaxcare.feature.chatbot.entity.ChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatbotSessionRepository extends JpaRepository<ChatbotSession, Long> {

    Optional<ChatbotSession> findBySessionKey(String sessionKey);

    @Query("""
        SELECT s FROM ChatbotSession s
        LEFT JOIN FETCH s.messages
        WHERE s.sessionKey = :sessionKey
        """)
    Optional<ChatbotSession> findBySessionKeyWithMessages(@Param("sessionKey") String sessionKey);

    List<ChatbotSession> findByAccount_AccountIdOrderByUpdatedAtDesc(Long accountId);
}
