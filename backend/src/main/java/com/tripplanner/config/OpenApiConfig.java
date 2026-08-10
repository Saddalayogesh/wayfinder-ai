package com.tripplanner.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger setup for the AI Trip Planner API.
 *
 * <p>The JWT bearer security scheme is pre-registered (even though
 * authentication does not exist yet) so that later phases can just annotate
 * controllers with {@code @SecurityRequirement} and Swagger UI picks it up.</p>
 *
 * <p>UI:  {@code http://localhost:8080/swagger-ui.html}<br>
 * Docs: {@code http://localhost:8080/v3/api-docs}</p>
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI aiTripPlannerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI Trip Planner API")
                        .description("""
                                Backend API for the AI Trip Planner monolith.

                                JWT bearer authentication is pre-configured for
                                future phases and is not required yet.
                                """)
                        .version("1.0.0"))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token here (not required yet).")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}
