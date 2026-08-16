package com.vaxcare.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI vaxcareOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VaxCare API")
                        .description("API hệ thống đặt lịch tiêm chủng thông minh VaxCare " +
                                "(Auth, Hồ sơ sức khỏe, Cơ sở tiêm chủng, Vắc xin, Lịch hẹn, Kho, Thanh toán, AI...)")
                        .version("v1 - Tuần 1 (Auth & Profiles)")
                        .contact(new Contact().name("VaxCare Backend Team")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập accessToken lấy được từ /api/v1/auth/login")));
    }
}
