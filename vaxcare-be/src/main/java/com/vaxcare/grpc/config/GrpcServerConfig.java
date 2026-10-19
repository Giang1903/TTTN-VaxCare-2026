package com.vaxcare.grpc.config;

import net.devh.boot.grpc.server.autoconfigure.GrpcServerSecurityAutoConfiguration;
import net.devh.boot.grpc.server.security.authentication.BearerAuthenticationReader;
import net.devh.boot.grpc.server.security.authentication.GrpcAuthenticationReader;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@Configuration
@EnableAutoConfiguration(exclude = {GrpcServerSecurityAutoConfiguration.class})
public class GrpcServerConfig {

    @Bean
    public GrpcAuthenticationReader grpcAuthenticationReader() {
        return new BearerAuthenticationReader(accessToken -> {
            Authentication auth = new UsernamePasswordAuthenticationToken(accessToken, accessToken);
            return auth;
        });
    }
}