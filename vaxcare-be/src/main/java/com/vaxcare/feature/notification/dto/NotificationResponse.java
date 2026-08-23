package com.vaxcare.feature.notification.dto;

import com.vaxcare.common.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long notificationId;
    private String title;
    private String content;
    private NotificationType type;
    private Boolean isRead;
    private Long relatedId;
    private LocalDateTime sentAt;
}
