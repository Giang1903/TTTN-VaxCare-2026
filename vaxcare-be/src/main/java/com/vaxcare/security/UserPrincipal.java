package com.vaxcare.security;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.feature.auth.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@AllArgsConstructor
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final AccountStatus status;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(Account account) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + account.getRole().name());
        return new UserPrincipal(
                account.getAccountId(),
                account.getEmail(),
                account.getPasswordHash(),
                account.getStatus(),
                Collections.singletonList(authority)
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Bug đã fix (16/08): trước đây luôn trả về true bất kể account.status, nghĩa là
     * một tài khoản đã bị khóa (SUSPENDED) vẫn đăng nhập được bình thường vì
     * CustomUserDetailsService/DaoAuthenticationProvider không hề kiểm tra field này.
     */
    @Override
    public boolean isAccountNonLocked() {
        return status != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == AccountStatus.ACTIVE;
    }
}
