package com.tripplanner.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Web configuration for the monolithic setup.
 *
 * <p><b>SPA fallback routing:</b> any request that is not an API call and not a
 * real static file is forwarded to {@code index.html}, so React Router
 * client-side routes (e.g. {@code /login}, {@code /register}) work on refresh
 * and direct URL access without a dedicated frontend server.</p>
 *
 * <p>How conflicts are avoided:</p>
 * <ul>
 *   <li><b>API paths</b> — the filter is ordered AFTER Spring Security's
 *       filter chain, so {@code /api/**} paths are already handled (or
 *       rejected with 404) before this filter runs.</li>
 *   <li><b>Static files</b> — the filter checks the last path segment for a
 *       dot; paths with an extension (e.g. {@code /assets/app-abc123.js},
 *       {@code /favicon.svg}) are passed through untouched so the static
 *       resource handler serves them.</li>
 * </ul>
 */
@Configuration
public class WebConfig {

    /**
     * Filter that forwards non-API, non-file requests to {@code /index.html}
     * for the React SPA. Runs late (after security and resource handlers) so
     * it only catches requests that nothing else handled.
     */
    @Component
    @Order(Ordered.LOWEST_PRECEDENCE)
    public static class SpaForwardFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(
                HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain) throws ServletException, IOException {

            String uri = request.getRequestURI();

            // Let API calls pass through (should already be handled, but
            // defensive).
            if (uri.startsWith("/api/")) {
                filterChain.doFilter(request, response);
                return;
            }

            // If the response has already been committed or is not a 404,
            // something already handled this request — pass through.
            if (response.isCommitted() || response.getStatus()
                    != HttpServletResponse.SC_NOT_FOUND) {
                filterChain.doFilter(request, response);
                return;
            }

            // Let real files (anything with an extension) fall through
            // to the static resource handler.
            String lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
            if (lastSegment.contains(".")) {
                filterChain.doFilter(request, response);
                return;
            }

            // Forward to the SPA entry point.
            request.getRequestDispatcher("/index.html")
                    .forward(request, response);
        }

        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {
            String path = request.getRequestURI();
            // Never filter API paths or requests with an extension.
            return path.startsWith("/api")
                    || path.contains(".");
        }
    }
}
