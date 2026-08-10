package com.tripplanner.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.ai.GeminiService;
import com.tripplanner.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The error envelope {status, message, timestamp} must be identical for every
 * HTTP error class. This test pins the two "infrastructure" cases the product
 * explicitly calls out: a 503 when an external provider is unreachable, and
 * the 500 safety net — both with the same JSON shape as 400/401/403/404/409.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ErrorResponseConsistencyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GeminiService geminiService;

    @Test
    void geminiUnreachableReturns503WithStandardEnvelope() throws Exception {
        String token = register("errors.503@example.com");
        when(geminiService.generateItinerary(any()))
                .thenThrow(new ServiceUnavailableException("Could not reach the Gemini API or the request timed out."));

        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validGenerateBody()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.message").value("Could not reach the Gemini API or the request timed out."))
                .andExpect(jsonPath("$.timestamp").isString());
    }

    @Test
    void unexpectedServerErrorReturns500WithSameEnvelopeShape() throws Exception {
        String token = register("errors.500@example.com");
        when(geminiService.generateItinerary(any()))
                .thenThrow(new IllegalStateException("boom"));

        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validGenerateBody()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.timestamp").isString());
    }

    // --- Helpers ----------------------------------------------------------------

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Error Tester","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String validGenerateBody() {
        return """
                {
                  "destination": "Kyoto",
                  "startDate": "2026-09-01",
                  "endDate": "2026-09-03",
                  "travelers": 2,
                  "budget": 1500.00,
                  "travelStyle": "CULTURAL",
                  "interests": ["Food"]
                }
                """;
    }
}
