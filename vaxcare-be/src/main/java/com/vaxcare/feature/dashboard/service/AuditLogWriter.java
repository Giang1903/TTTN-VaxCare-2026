package com.vaxcare.feature.dashboard.service;

import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.dashboard.entity.AuditLog;
import com.vaxcare.feature.dashboard.repository.AuditLogRepository;
import com.vaxcare.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;
    private final AccountRepository accountRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(String action, String entityType, Long entityId, String oldValue, String newValue) {
        try {
            Account actor = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal up) {
                actor = accountRepository.findById(up.getId()).orElse(null);
            }
            auditLogRepository.save(AuditLog.builder()
                    .account(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .build());
        } catch (Exception ignored) {
            // never break main flow
        }
    }
}