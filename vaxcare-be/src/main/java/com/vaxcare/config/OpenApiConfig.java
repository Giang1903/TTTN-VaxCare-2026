package com.vaxcare.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springdoc.core.utils.SpringDocUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

  
    static {
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now().withSecond(0).withNano(0);
        LocalDateTime nowDateTime = LocalDateTime.now().withSecond(0).withNano(0);

        SpringDocUtils.getConfig()
                .replaceWithSchema(LocalDate.class, new io.swagger.v3.oas.models.media.StringSchema()
                        .example(today.toString()).format("date"))
                .replaceWithSchema(LocalTime.class, new io.swagger.v3.oas.models.media.StringSchema()
                        .example(nowTime.toString()).format("time"))
                .replaceWithSchema(LocalDateTime.class, new io.swagger.v3.oas.models.media.StringSchema()
                        .example(nowDateTime.toString()).format("date-time"));
    }

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
