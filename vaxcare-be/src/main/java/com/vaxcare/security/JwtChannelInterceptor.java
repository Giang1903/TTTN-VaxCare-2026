package com.vaxcare.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String jwt = extractToken(accessor);
            if (!StringUtils.hasText(jwt) || !tokenProvider.validateToken(jwt)) {
                log.warn("WebSocket CONNECT bị từ chối: JWT không hợp lệ hoặc thiếu");
                throw new IllegalArgumentException("Unauthorized: invalid or missing JWT");
            }

            try {
                Long userId = tokenProvider.getUserIdFromJWT(jwt);
                UserDetails userDetails = customUserDetailsService.loadUserById(userId);

                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    log.warn("WebSocket CONNECT bị từ chối: tài khoản id={} không ACTIVE", userId);
                    throw new IllegalArgumentException("Unauthorized: account not active");
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
                accessor.setUser(authentication);
                log.debug("WebSocket authenticated user id={}", userId);
            } catch (Exception e) {
                log.error("WebSocket auth error", e);
                throw new IllegalArgumentException("Unauthorized: " + e.getMessage());
            }
        }
        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearer = authHeaders.get(0);
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                return bearer.substring(7);
            }
            if (StringUtils.hasText(bearer)) {
                return bearer;
            }
        }
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty() && StringUtils.hasText(tokenHeaders.get(0))) {
            return tokenHeaders.get(0);
        }
        return null;
    }
}
