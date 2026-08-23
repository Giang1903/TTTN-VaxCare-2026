package com.vaxcare.feature.notification.repository;

import com.vaxcare.feature.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByAccount_AccountIdOrderBySentAtDesc(Long accountId);

    long countByAccount_AccountIdAndIsReadFalse(Long accountId);

    boolean existsByAccount_AccountIdAndRelatedIdAndType(
            Long accountId, Long relatedId, com.vaxcare.common.enums.NotificationType type);
}
