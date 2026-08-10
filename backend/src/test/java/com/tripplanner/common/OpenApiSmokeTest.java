package com.tripplanner.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Smoke test that the OpenAPI/Swagger doc generation isn't broken: the
 * public /v3/api-docs endpoint must return valid JSON describing the API.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void apiDocsReturnValidOpenApiJsonWithCoreEndpoints() throws Exception {
        MvcResult result = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode doc = objectMapper.readTree(result.getResponse().getContentAsString());

        // Valid OpenAPI document shape.
        assertThat(doc.path("openapi").asText()).startsWith("3.");
        assertThat(doc.path("info").path("title").asText()).isNotBlank();
        assertThat(doc.path("paths").isObject()).isTrue();

        // The endpoints the SPA depends on are all documented.
        for (String path : new String[]{
                "/api/auth/register",
                "/api/auth/login",
                "/api/trips",
                "/api/trips/generate",
                "/api/trips/{tripId}/days/{dayNumber}/regenerate",
                "/api/places/search",
                "/api/favorites",
                "/api/users/me",
                "/api/admin/cache/places",
        }) {
            assertThat(doc.path("paths").has(path))
                    .as("OpenAPI document should describe %s", path)
                    .isTrue();
        }

        // The JWT bearer security scheme is declared (used by the Authorize button).
        assertThat(doc.path("components").path("securitySchemes").has("bearerAuth"))
                .isTrue();
    }
}
