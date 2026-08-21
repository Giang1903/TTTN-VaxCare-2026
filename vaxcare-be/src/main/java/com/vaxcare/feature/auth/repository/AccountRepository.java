package com.vaxcare.feature.auth.repository;

import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Account> findByRole(Role role);

    Optional<Account> findByVerificationToken(String verificationToken);
}