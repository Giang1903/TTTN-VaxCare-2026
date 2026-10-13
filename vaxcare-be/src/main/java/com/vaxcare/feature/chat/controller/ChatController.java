package com.vaxcare.feature.chat.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.chat.dto.ChatMessageRequest;
import com.vaxcare.feature.chat.dto.ChatMessageResponse;
import com.vaxcare.feature.chat.dto.ConversationSummaryResponse;
import com.vaxcare.feature.chat.service.ChatService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Chat realtime")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    @Operation(summary = "Gửi tin nhắn (REST fallback; ưu tiên dùng WebSocket /app/chat.send)")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success("Gửi tin nhắn thành công",
                chatService.sendMessage(principal.getId(), request));
    }

    @GetMapping("/messages")
    @Operation(summary = "Lịch sử chat 1-1 với một partner (phân trang)")
    public ApiResponse<Page<ChatMessageResponse>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long partnerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success("Lấy lịch sử chat thành công",
                chatService.getConversationHistory(principal.getId(), partnerId, page, size));
    }

    @GetMapping("/conversations")
    @Operation(summary = "Danh sách cuộc hội thoại gần đây")
    public ApiResponse<List<ConversationSummaryResponse>> getConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Lấy danh sách hội thoại thành công",
                chatService.getConversations(principal.getId()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Số tin nhắn chưa đọc")
    public ApiResponse<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("OK",
                Map.of("unreadCount", chatService.countUnread(principal.getId())));
    }

    @PatchMapping("/messages/{messageId}/read")
    @Operation(summary = "Đánh dấu một tin đã đọc")
    public ApiResponse<ChatMessageResponse> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long messageId) {
        return ApiResponse.success("Đánh dấu đã đọc thành công",
                chatService.markAsRead(messageId, principal.getId()));
    }

    @PatchMapping("/conversations/{partnerId}/read")
    @Operation(summary = "Đánh dấu toàn bộ tin trong hội thoại với partner là đã đọc")
    public ApiResponse<Map<String, Integer>> markConversationAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long partnerId) {
        int updated = chatService.markConversationAsRead(principal.getId(), partnerId);
        return ApiResponse.success("Đánh dấu đã đọc thành công", Map.of("updated", updated));
    }
}
