package com.tripplanner.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

/**
 * Web configuration for the monolithic setup.
 *
 * <p><b>SPA fallback routing:</b> any path that is not an API call and not a
 * real static file is forwarded to {@code index.html}, so React Router
 * client-side routes (e.g. {@code /login}, {@code /register}) work on refresh
 * and direct URL access without a dedicated frontend server.</p>
 *
 * <p>How conflicts are avoided:</p>
 * <ul>
 *   <li><b>API paths</b> — real controllers such as {@code /api/health} take
 *       precedence (more specific mapping in the same handler mapping), and
 *       unknown {@code /api/**} paths are rejected with {@code 404} instead of
 *       being swallowed by the SPA fallback.</li>
 *   <li><b>Static files</b> — the patterns only match paths whose last segment
 *       contains no dot, so real files like {@code /assets/app-abc123.js} or
 *       {@code /favicon.svg} are still served by the static resource handler.</li>
 * </ul>
 */
@Configuration
public class WebConfig {

    /**
     * Controller for the SPA fallback. Implemented as a controller (rather
     * than plain view controllers) so we can inspect the request URI and keep
     * {@code /api/**} out of the fallback.
     */
    @Controller
    public static class SpaForwardController {

        @GetMapping(value = {"/", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
        public String forward(HttpServletRequest request) {
            String uri = request.getRequestURI();
            if (uri.equals("/api") || uri.startsWith("/api/")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No API endpoint matches: " + uri);
            }
            return "forward:/index.html";
        }
    }
}
