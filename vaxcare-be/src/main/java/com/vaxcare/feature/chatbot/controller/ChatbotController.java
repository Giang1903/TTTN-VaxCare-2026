package com.vaxcare.feature.chatbot.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.chatbot.dto.ChatbotChatRequest;
import com.vaxcare.feature.chatbot.dto.ChatbotChatResponse;
import com.vaxcare.feature.chatbot.service.ChatbotService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Proxy chatbot AI + lưu hội thoại")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chat")
    @Operation(summary = "Gửi tin nhắn chatbot (guest hoặc đã đăng nhập). BE enrich hồ sơ tiêm nếu có JWT.")
    public ApiResponse<ChatbotChatResponse> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatbotChatRequest request) {
        ChatbotChatResponse resp = chatbotService.chat(request, principal);
        return ApiResponse.success("OK", resp);
    }

    @GetMapping("/sessions/{sessionKey}/messages")
    @Operation(summary = "Lấy lịch sử tin nhắn theo session_key (chỉ owner nếu session gắn account)")
    public ApiResponse<List<Map<String, Object>>> history(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String sessionKey) {
        return ApiResponse.success("OK", chatbotService.getHistory(sessionKey, principal));
    }
}
