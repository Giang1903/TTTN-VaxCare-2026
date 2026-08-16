package com.vaxcare.security;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.entity.Account;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserPrincipalTest {

    private Account buildAccount(AccountStatus status) {
        return Account.builder()
                .accountId(1L)
                .email("test@vaxcare.com")
                .passwordHash("hashed")
                .role(Role.USER)
                .status(status)
                .build();
    }

    @Test
    void activeAccount_isEnabledAndNotLocked() {
        UserPrincipal principal = UserPrincipal.create(buildAccount(AccountStatus.ACTIVE));

        assertThat(principal.isEnabled()).isTrue();
        assertThat(principal.isAccountNonLocked()).isTrue();
    }

    @Test
    void inactiveAccount_isDisabled() {
        UserPrincipal principal = UserPrincipal.create(buildAccount(AccountStatus.INACTIVE));

        assertThat(principal.isEnabled()).isFalse();
    }

    @Test
    void suspendedAccount_isLocked() {
        UserPrincipal principal = UserPrincipal.create(buildAccount(AccountStatus.SUSPENDED));

        assertThat(principal.isAccountNonLocked()).isFalse();
        // Tài khoản bị khóa thì cũng không được coi là "enabled" theo nghĩa sử dụng bình thường
        assertThat(principal.isEnabled()).isFalse();
    }

    @Test
    void deletedAccount_isDisabled() {
        UserPrincipal principal = UserPrincipal.create(buildAccount(AccountStatus.DELETED));

        assertThat(principal.isEnabled()).isFalse();
    }

    @Test
    void authorityHasCorrectRolePrefix() {
        UserPrincipal principal = UserPrincipal.create(buildAccount(AccountStatus.ACTIVE));

        assertThat(principal.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_USER");
    }
}
