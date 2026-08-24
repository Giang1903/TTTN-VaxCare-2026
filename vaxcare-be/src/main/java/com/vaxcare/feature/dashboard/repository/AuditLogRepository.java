package com.vaxcare.feature.dashboard.repository;

import com.vaxcare.feature.dashboard.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
        SELECT a FROM AuditLog a
        LEFT JOIN FETCH a.account
        WHERE (:entityType IS NULL OR a.entityType = :entityType)
        ORDER BY a.createdAt DESC
        """)
    List<AuditLog> search(@Param("entityType") String entityType, Pageable pageable);
}