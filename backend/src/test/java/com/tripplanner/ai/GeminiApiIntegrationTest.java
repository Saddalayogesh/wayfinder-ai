package com.tripplanner.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.places.PlacesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end verification of the generate endpoint with the real security
 * chain, persistence, and rate limiter — the Gemini HTTP client is mocked,
 * so the real API is never called.
 */
@SpringBootTest
@AutoConfigureMockMvc
class GeminiApiIntegrationTest {

    private static final String VALID_JSON = """
            {
              "destination": "Tokyo",
              "days": [
                { "day": 1, "activities": [
                  { "name": "Senso-ji", "duration": 120, "estimatedCost": 10.5, "latitude": 35.71, "longitude": 139.79 }
                ]},
                { "day": 2, "activities": [
                  { "name": "TeamLab Planets", "duration": 90, "estimatedCost": 25 }
                ]}
              ]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GeminiClient geminiClient;

    @MockBean
    private PlacesService placesService;

    @Test
    void generatePersistsTripWithDaysAndItems() throws Exception {
        when(geminiClient.generateText(anyString())).thenReturn(VALID_JSON);
        String token = register("gemini.ok@example.com");

        MvcResult result = mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("AI itinerary for Tokyo"))
                .andExpect(jsonPath("$.days.length()").value(3)) // 2026-08-15..17
                .andExpect(jsonPath("$.days[0].items[0].placeName").value("Senso-ji"))
                .andExpect(jsonPath("$.days[0].items[0].estimatedCost").value(10.5))
                .andExpect(jsonPath("$.days[1].items[0].placeName").value("TeamLab Planets"))
                .andReturn();

        long tripId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Persisted and retrievable through the normal trip flow.
        mockMvc.perform(get("/api/trips/" + tripId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].date").value("2026-08-15"))
                .andExpect(jsonPath("$.days[2].date").value("2026-08-17"));
    }

    @Test
    void malformedGeminiResponseReturns502AndPersistsNothing() throws Exception {
        when(geminiClient.generateText(anyString())).thenReturn("not json at all {{{");
        String token = register("gemini.bad@example.com");

        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Nothing was written to the DB.
        mockMvc.perform(get("/api/trips").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void geminiExceptionPropagatesAs502() throws Exception {
        when(geminiClient.generateText(anyString()))
                .thenThrow(new com.tripplanner.exception.ItineraryGenerationException("Gemini blocked the request: SAFETY"));
        String token = register("gemini.refused@example.com");

        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("Gemini blocked the request: SAFETY"));
    }

    @Test
    void rateLimitReturns429() throws Exception {
        when(geminiClient.generateText(anyString())).thenReturn(VALID_JSON);
        String token = register("gemini.limited@example.com");

        // Capacity is 3 (from application.yml defaults).
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/trips/generate")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(generateBody()))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody()))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));

        // Gemini was reached exactly 3 times — the 4th call never got through.
        verify(geminiClient, times(3)).generateText(anyString());
    }

    @Test
    void invalidPayloadReturns400() throws Exception {
        String token = register("gemini.invalid@example.com");

        mockMvc.perform(post("/api/trips/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"destination":"","startDate":"2026-08-17","endDate":"2026-08-15","travelers":0,"budget":0,"travelStyle":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    // --- Helpers ----------------------------------------------------------------

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Gemini User","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String generateBody() {
        return """
                {
                  "destination": "Tokyo",
                  "startDate": "2026-08-15",
                  "endDate": "2026-08-17",
                  "travelers": 2,
                  "budget": 3000.00,
                  "travelStyle": "ADVENTURE",
                  "interests": ["Food", "Culture"]
                }
                """;
    }
}
