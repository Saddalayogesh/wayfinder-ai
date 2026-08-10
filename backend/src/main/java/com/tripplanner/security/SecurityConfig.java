package com.tripplanner.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.exception.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

/**
 * Stateless, JWT-based Spring Security configuration.
 *
 * <ul>
 *   <li>Sessions are disabled ({@code STATELESS}); every request must carry a JWT.</li>
 *   <li>Passwords are stored as BCrypt hashes ({@link BCryptPasswordEncoder}).</li>
 *   <li>{@link JwtAuthenticationFilter} runs before the standard filters and
 *       authenticates requests presenting a valid Bearer token.</li>
 *   <li>{@code @PreAuthorize} method security is enabled ({@link EnableMethodSecurity})
 *       so future endpoints can restrict access per role (USER vs ADMIN).</li>
 *   <li>401/403 from the filter chain are written as the same
 *       {@code { status, message, timestamp }} JSON envelope as the
 *       {@code @RestControllerAdvice}.</li>
 * </ul>
 *
 * <p>Route rules:</p>
 * <ul>
 *   <li>Public: {@code /api/auth/**} (register/login), {@code /api/health}, {@code /error}.</li>
 *   <li>Authenticated: every other {@code /api/**} route.</li>
 *   <li>Public: everything else — the React SPA (static assets + client-side
 *       fallback routes) and Swagger UI / OpenAPI docs ({@code /swagger-ui.html},
 *       {@code /swagger-ui/**}, {@code /v3/api-docs/**}).</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationFilter jwtAuthenticationFilter,
                                                   ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(unauthorizedEntryPoint(objectMapper))
                        .accessDeniedHandler(forbiddenHandler(objectMapper)))
                .authorizeHttpRequests(auth -> auth
                        // Public: authentication endpoints, health probe, error dispatch
                        .requestMatchers("/api/auth/**", "/api/health", "/error").permitAll()
                        // Everything else under /api requires a valid JWT
                        .requestMatchers("/api/**").authenticated()
                        // Everything else is the SPA (static assets + client-side routes)
                        // or Swagger UI / OpenAPI docs — served without authentication
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private AuthenticationEntryPoint unauthorizedEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            writeError(response, objectMapper, ApiError.of(HttpStatus.UNAUTHORIZED,
                    "Authentication is required to access this resource"));
        };
    }

    private AccessDeniedHandler forbiddenHandler(ObjectMapper objectMapper) {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            writeError(response, objectMapper, ApiError.of(HttpStatus.FORBIDDEN,
                    "You do not have permission to perform this action"));
        };
    }

    private void writeError(HttpServletResponse response, ObjectMapper objectMapper, ApiError error)
            throws IOException {
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
