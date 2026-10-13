package com.vaxcare.feature.chat.controller;

import com.vaxcare.feature.chat.dto.ChatMessageRequest;
import com.vaxcare.feature.chat.dto.ChatMessageResponse;
import com.vaxcare.feature.chat.service.ChatService;
import com.vaxcare.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    @SendToUser("/queue/messages") 
    public ChatMessageResponse sendMessage(
            @Payload @Valid ChatMessageRequest request,
            Authentication authentication) {

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        log.debug("WS chat.send from userId={} to recipientId={}", principal.getId(), request.getRecipientId());
        return chatService.sendMessage(principal.getId(), request);
    }
}
