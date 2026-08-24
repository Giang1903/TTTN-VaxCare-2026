package com.vaxcare.feature.notification.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.notification.dto.NotificationResponse;
import com.vaxcare.feature.notification.service.NotificationService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "19. Notification", description = "Thông báo trong app: nhắc lịch tiêm, xác nhận thanh toán, hệ thống...")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách thông báo thành công",
                notificationService.getMyNotifications(userPrincipal.getId()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> countUnread(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy số thông báo chưa đọc thành công",
                Map.of("unreadCount", notificationService.countUnread(userPrincipal.getId())));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Đánh dấu đã đọc thành công",
                notificationService.markAsRead(id, userPrincipal.getId()));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAllAsRead(userPrincipal.getId());
        return ApiResponse.success("Đánh dấu tất cả đã đọc thành công", null);
    }
}
