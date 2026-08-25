package com.vaxcare.feature.system.service;

import com.vaxcare.feature.dashboard.service.AuditLogWriter;
import com.vaxcare.feature.system.dto.SystemConfigResponse;
import com.vaxcare.feature.system.dto.SystemConfigUpdateRequest;
import com.vaxcare.feature.system.entity.SystemConfig;
import com.vaxcare.feature.system.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditLogWriter auditLogWriter;

    @Transactional(readOnly = true)
    public List<SystemConfigResponse> listAll() {
        return systemConfigRepository.findAll().stream().map(this::map).toList();
    }

    @Transactional
    public SystemConfigResponse upsert(SystemConfigUpdateRequest req) {
        SystemConfig cfg = systemConfigRepository.findById(req.getKey()).orElse(
                SystemConfig.builder().configKey(req.getKey()).build());
        String old = cfg.getConfigValue();
        if (req.getValue() != null) cfg.setConfigValue(req.getValue());
        if (req.getDescription() != null) cfg.setDescription(req.getDescription());
        SystemConfig saved = systemConfigRepository.save(cfg);
        auditLogWriter.write("UPDATE_CONFIG", "CONFIG", null, old, saved.getConfigValue());
        return map(saved);
    }

    @Transactional
    public List<SystemConfigResponse> upsertBatch(List<SystemConfigUpdateRequest> reqs) {
        return reqs.stream().map(this::upsert).toList();
    }

    private SystemConfigResponse map(SystemConfig c) {
        return SystemConfigResponse.builder()
                .key(c.getConfigKey())
                .value(c.getConfigValue())
                .description(c.getDescription())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}