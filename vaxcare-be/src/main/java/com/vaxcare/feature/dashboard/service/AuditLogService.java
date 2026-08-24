package com.vaxcare.feature.dashboard.service;

import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.dashboard.dto.AuditLogResponse;
import com.vaxcare.feature.dashboard.entity.AuditLog;
import com.vaxcare.feature.dashboard.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<AuditLogResponse> list(String entityType, int limit) {
        int size = Math.min(Math.max(limit, 1), 500);
        return auditLogRepository.search(
                        (entityType == null || entityType.isBlank()) ? null : entityType.trim(),
                        PageRequest.of(0, size))
                .stream()
                .map(this::map)
                .toList();
    }

    private AuditLogResponse map(AuditLog log) {
        Account acc = log.getAccount();
        String email = acc != null ? acc.getEmail() : null;
        String name = email; // avoid lazy graph; email is enough for audit list
        return AuditLogResponse.builder()
                .logId(log.getLogId())
                .accountId(acc != null ? acc.getAccountId() : null)
                .actorEmail(email)
                .actorName(name)
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}