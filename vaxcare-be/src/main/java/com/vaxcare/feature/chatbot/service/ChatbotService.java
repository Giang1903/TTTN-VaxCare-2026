package com.vaxcare.feature.chatbot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaxcare.feature.ai.client.AiServiceClient;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.chatbot.dto.*;
import com.vaxcare.feature.chatbot.entity.ChatbotMessage;
import com.vaxcare.feature.chatbot.entity.ChatbotSession;
import com.vaxcare.feature.chatbot.repository.ChatbotMessageRepository;
import com.vaxcare.feature.chatbot.repository.ChatbotSessionRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.entity.VaccinationHistory;
import com.vaxcare.feature.vaccination.repository.VaccinationHistoryRepository;
import com.vaxcare.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final AiServiceClient aiServiceClient;
    private final ChatbotSessionRepository sessionRepository;
    private final ChatbotMessageRepository messageRepository;
    private final AccountRepository accountRepository;
    private final VaccinationHistoryRepository vaccinationHistoryRepository;
    private final ObjectMapper objectMapper;

    public ChatbotChatResponse chat(ChatbotChatRequest request, UserPrincipal principal) {
        String sessionKey = resolveSessionKey(request.getSessionId());
        Account account = principal != null
                ? accountRepository.findById(principal.getId()).orElse(null)
                : null;

        ChatbotSession session = ensureSession(sessionKey, account);
        Map<String, Object> context = buildContext(request.getContext(), account);

        AiChatRequestDto aiRequest = AiChatRequestDto.builder()
                .message(request.getMessage().trim())
                .sessionId(session.getSessionKey())
                .userId(resolveUserId(account))
                .context(context)
                .build();

        persistUserMessage(session.getSessionId(), request.getMessage().trim());

        AiChatResponseDto aiResp;
        try {
            aiResp = aiServiceClient.chat(aiRequest);
        } catch (Exception ex) {
            log.error("[Chatbot] AI call failed: {}", ex.getMessage());
            ChatbotChatResponse fallback = ChatbotChatResponse.builder()
                    .reply("Xin lỗi, trợ lý tiêm chủng tạm thời không phản hồi được. "
                            + "Bạn thử lại sau vài phút hoặc liên hệ hỗ trợ VaxCare nhé.")
                    .intent("error")
                    .intentConfidence(0.0)
                    .sessionId(session.getSessionKey())
                    .safeMode(true)
                    .sources(List.of())
                    .actions(List.of())
                    .meta(Map.of(
                            "error", "ai_unavailable",
                            "detail", ex.getMessage() != null ? ex.getMessage() : "unknown"))
                    .build();
            persistBotMessage(
                    session.getSessionId(),
                    fallback.getReply(),
                    "error",
                    0.0,
                    true,
                    toJson(fallback.getMeta()));
            return fallback;
        }

        String reply = aiResp.getReply() != null ? aiResp.getReply() : "";
        String intent = aiResp.getIntent() != null ? aiResp.getIntent() : "unknown";
        Double conf = aiResp.getIntentConfidence() != null ? aiResp.getIntentConfidence() : 0.0;
        Boolean safe = aiResp.getSafeMode() != null ? aiResp.getSafeMode() : false;
        String finalSessionKey = aiResp.getSessionId() != null
                ? aiResp.getSessionId()
                : session.getSessionKey();

        if (!finalSessionKey.equals(session.getSessionKey())) {
            updateSessionKey(session.getSessionId(), finalSessionKey);
        }

        Map<String, Object> meta = aiResp.getMeta() != null
                ? new HashMap<>(aiResp.getMeta())
                : new HashMap<>();
        if (aiResp.getSources() != null && !aiResp.getSources().isEmpty()) {
            meta.put("sources_count", aiResp.getSources().size());
        }
        if (aiResp.getActions() != null && !aiResp.getActions().isEmpty()) {
            meta.put("actions", aiResp.getActions());
        }

        persistBotMessage(session.getSessionId(), reply, intent, conf, safe, toJson(meta));

        return ChatbotChatResponse.builder()
                .reply(reply)
                .intent(intent)
                .intentConfidence(conf)
                .sources(aiResp.getSources() != null ? aiResp.getSources() : List.of())
                .actions(aiResp.getActions() != null ? aiResp.getActions() : List.of())
                .sessionId(finalSessionKey)
                .safeMode(safe)
                .meta(meta)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(String sessionKey, UserPrincipal principal) {
        Optional<ChatbotSession> opt = sessionRepository.findBySessionKeyWithMessages(sessionKey);
        if (opt.isEmpty()) {
            return List.of();
        }
        ChatbotSession session = opt.get();
        if (session.getAccount() != null) {
            if (principal == null || !session.getAccount().getAccountId().equals(principal.getId())) {
                return List.of();
            }
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (ChatbotMessage m : session.getMessages()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("role", m.getRole());
            row.put("content", m.getContent());
            row.put("intent", m.getIntent());
            row.put("createdAt", m.getCreatedAt());
            out.add(row);
        }
        return out;
    }

    @Transactional
    protected ChatbotSession ensureSession(String sessionKey, Account account) {
        Optional<ChatbotSession> existing = sessionRepository.findBySessionKey(sessionKey);
        if (existing.isPresent()) {
            ChatbotSession s = existing.get();
            if (s.getAccount() == null && account != null) {
                s.setAccount(account);
                return sessionRepository.save(s);
            }
            return s;
        }
        ChatbotSession created = ChatbotSession.builder()
                .sessionKey(sessionKey)
                .account(account)
                .build();
        return sessionRepository.save(created);
    }

    @Transactional
    protected void persistUserMessage(Long sessionId, String content) {
        ChatbotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found: " + sessionId));
        ChatbotMessage msg = ChatbotMessage.builder()
                .session(session)
                .role("USER")
                .content(content)
                .build();
        messageRepository.save(msg);
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Transactional
    protected void persistBotMessage(
            Long sessionId,
            String content,
            String intent,
            Double conf,
            Boolean safeMode,
            String metaJson) {
        ChatbotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found: " + sessionId));
        ChatbotMessage msg = ChatbotMessage.builder()
                .session(session)
                .role("BOT")
                .content(content)
                .intent(intent)
                .intentConfidence(conf)
                .safeMode(safeMode)
                .metaJson(metaJson)
                .build();
        messageRepository.save(msg);
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Transactional
    protected void updateSessionKey(Long sessionId, String newKey) {
        sessionRepository.findById(sessionId).ifPresent(s -> {
            s.setSessionKey(newKey);
            sessionRepository.save(s);
        });
    }

    private String resolveSessionKey(String fromClient) {
        if (fromClient != null && !fromClient.isBlank()) {
            return fromClient.trim();
        }
        return UUID.randomUUID().toString();
    }

    private Long resolveUserId(Account account) {
        if (account == null) {
            return null;
        }
        Account full = accountRepository.findByIdWithProfiles(account.getAccountId()).orElse(account);
        return full.getUser() != null ? full.getUser().getUserId() : null;
    }

    private Map<String, Object> buildContext(Map<String, Object> fromClient, Account account) {
        Map<String, Object> ctx = fromClient != null
                ? new HashMap<>(fromClient)
                : new HashMap<>();

        if (account == null) {
            return ctx;
        }

        Account full = accountRepository.findByIdWithProfiles(account.getAccountId()).orElse(account);
        User user = full.getUser();
        if (user == null) {
            return ctx;
        }

        ctx.put("user_id", user.getUserId());
        if (user.getFullName() != null) {
            ctx.put("full_name", user.getFullName());
        }
        if (user.getDateOfBirth() != null) {
            LocalDate dob = user.getDateOfBirth();
            Period age = Period.between(dob, LocalDate.now());
            ctx.put("age_years", age.getYears());
            ctx.put("age_months", age.getYears() * 12 + age.getMonths());
            ctx.put("date_of_birth", dob.toString());
        }

        vaccinationHistoryRepository.findByUserIdWithDetails(user.getUserId()).ifPresent(history -> {
            List<Map<String, Object>> records = mapVaccinationRecords(history);
            ctx.put("records", records);
            ctx.put("vaccination_records", records);
        });

        return ctx;
    }

    private List<Map<String, Object>> mapVaccinationRecords(VaccinationHistory history) {
        List<Map<String, Object>> records = new ArrayList<>();
        if (history.getDetails() == null) {
            return records;
        }
        for (VaccinationDetail d : history.getDetails()) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("detail_id", d.getDetailId());
            r.put("dose_number", d.getDoseNumber());
            r.put("injection_date", d.getInjectionDate() != null ? d.getInjectionDate().toString() : null);
            r.put("result", d.getResult() != null ? d.getResult().name() : null);
            if (d.getVaccine() != null) {
                r.put("vaccine_id", d.getVaccine().getVaccineId());
                r.put("vaccine_name", d.getVaccine().getVaccineName());
            }
            records.add(r);
        }
        return records;
    }

    private String toJson(Object o) {
        if (o == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            return null;
        }
    }
}
