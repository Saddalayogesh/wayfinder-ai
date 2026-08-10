package com.tripplanner.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;

import java.util.List;
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

                                Authentication is JWT bearer-based. Register or sign in via
                                POST /api/auth/register or POST /api/auth/login, copy the
                                returned token, click \"Authorize\" above and paste it. The
                                auth and health endpoints are public; every other /api/**
                                route requires a valid token.
                                """)
                        .version("1.0.0"))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Paste your JWT from POST /api/auth/login here.")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .tags(List.of(
                        new Tag().name("Auth").description("Public account creation and sign-in"),
                        new Tag().name("Trips").description("Trip CRUD and itinerary management (JWT required)"),
                        new Tag().name("AI").description("Gemini-powered itinerary generation and day regeneration"),
                        new Tag().name("Places").description("Place search and details from the active provider"),
                        new Tag().name("Favorites").description("User-scoped saved places"),
                        new Tag().name("Sharing").description("Public read-only trip sharing via random token"),
                        new Tag().name("Users").description("Profile and role-scoped user endpoints"),
                        new Tag().name("Admin").description("Operational endpoints — ADMIN role required")));
    }
}
