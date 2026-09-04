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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;
    private final AccountRepository accountRepository;
    private final PlatformTransactionManager transactionManager;
    public void write(String action, String entityType, Long entityId, String oldValue, String newValue) {
        try {
            TransactionTemplate template = new TransactionTemplate(transactionManager);
            template.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
            template.executeWithoutResult(status -> {
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
                        .oldValue(toJsonStringOrNull(oldValue))
                        .newValue(toJsonStringOrNull(newValue))
                        .build());
            });
        } catch (Exception ignored) {
            // never break main flow
        }
    }

    /** Cột DB kiểu JSON — chuỗi thuần phải được quote thành JSON string hợp lệ. */
    private static String toJsonStringOrNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}"))
                || (trimmed.startsWith("[") && trimmed.endsWith("]"))
                || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
            return trimmed;
        }
        return "\"" + trimmed.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
