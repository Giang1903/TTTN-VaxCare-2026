package com.vaxcare.feature.auth.repository;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Account> findByRole(Role role);
    
    long countByRole(Role role);

    Optional<Account> findByVerificationToken(String verificationToken);

    @Query("""
        SELECT a FROM Account a
        LEFT JOIN FETCH a.user u
        LEFT JOIN FETCH a.medicalStaff ms
        LEFT JOIN FETCH ms.facility
        LEFT JOIN FETCH a.admin ad
        WHERE (:role IS NULL OR a.role = :role)
          AND (:status IS NULL OR a.status = :status)
          AND (:keyword IS NULL
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR a.phone LIKE CONCAT('%', :keyword, '%')
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(ms.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(ad.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY a.createdAt DESC
        """)
    List<Account> searchAccounts(@Param("role") Role role,
                                  @Param("status") AccountStatus status,
                                  @Param("keyword") String keyword);

    @Query("""
        SELECT a FROM Account a
        LEFT JOIN FETCH a.user
        LEFT JOIN FETCH a.medicalStaff ms
        LEFT JOIN FETCH ms.facility
        LEFT JOIN FETCH a.admin
        WHERE a.accountId = :accountId
        """)
    Optional<Account> findByIdWithProfiles(@Param("accountId") Long accountId);
}