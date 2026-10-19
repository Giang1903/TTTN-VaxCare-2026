package com.vaxcare.grpc.interceptor;

import com.vaxcare.security.CustomUserDetailsService;
import com.vaxcare.security.JwtTokenProvider;
import com.vaxcare.security.UserPrincipal;
import io.grpc.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@GrpcGlobalServerInterceptor
@RequiredArgsConstructor
public class GrpcAuthInterceptor implements ServerInterceptor {

    public static final Context.Key<UserPrincipal> USER_PRINCIPAL_KEY = Context.key("userPrincipal");
    public static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER);

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String authHeader = headers.get(AUTHORIZATION_KEY);
        Context ctx = Context.current();

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtTokenProvider.validateToken(token)) {
                    Long accountId = jwtTokenProvider.getUserIdFromJWT(token);
                    UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserById(accountId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    ctx = ctx.withValue(USER_PRINCIPAL_KEY, principal);
                }
            } catch (Exception e) {
                log.debug("gRPC JWT validation failed: {}", e.getMessage());
            }
        }

        return Contexts.interceptCall(ctx, call, headers, next);
    }
}
