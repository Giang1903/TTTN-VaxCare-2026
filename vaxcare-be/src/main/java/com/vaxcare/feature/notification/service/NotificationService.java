package com.vaxcare.feature.notification.service;

import com.vaxcare.common.enums.NotificationType;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.notification.dto.NotificationResponse;
import com.vaxcare.feature.notification.entity.Notification;
import com.vaxcare.feature.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification create(Account account, String title, String content, NotificationType type, Long relatedId) {
        Notification notification = Notification.builder()
                .account(account)
                .title(title)
                .content(content)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public boolean alreadyNotified(Long accountId, Long relatedId, NotificationType type) {
        return notificationRepository.existsByAccount_AccountIdAndRelatedIdAndType(accountId, relatedId, type);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long accountId) {
        return notificationRepository.findByAccount_AccountIdOrderBySentAtDesc(accountId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long accountId) {
        return notificationRepository.countByAccount_AccountIdAndIsReadFalse(accountId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long currentAccountId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo có ID: " + notificationId));

        if (!notification.getAccount().getAccountId().equals(currentAccountId)) {
            throw new UnauthorizedException("Bạn không có quyền thao tác trên thông báo này!");
        }

        notification.setIsRead(true);
        return mapToResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(Long accountId) {
        List<Notification> notifications = notificationRepository.findByAccount_AccountIdOrderBySentAtDesc(accountId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .isRead(n.getIsRead())
                .relatedId(n.getRelatedId())
                .sentAt(n.getSentAt())
                .build();
    }
}
