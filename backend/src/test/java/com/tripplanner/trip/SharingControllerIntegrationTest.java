package com.tripplanner.trip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end sharing over the real security chain: owner-only token creation,
 * public read-only access WITHOUT a JWT, 404 for unknown tokens, and 403 when
 * a non-owner tries to share someone else's trip.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SharingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shareAndViewPublicly() throws Exception {
        String tokenA = register("share.alice@example.com");
        String tokenB = register("share.bob@example.com");

        long tripId = createTrip(tokenA, "Kyoto");

        // Owner shares -> random token + public URL.
        MvcResult share = mockMvc.perform(post("/api/trips/" + tripId + "/share")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.shareUrl").value(org.hamcrest.Matchers.containsString("/shared/trips/")))
                .andReturn();
        String shareToken = objectMapper.readTree(share.getResponse().getContentAsString())
                .get("token").asText();

        // Anyone can view it — no Authorization header at all.
        mockMvc.perform(get("/api/shared/trips/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destination").value("Kyoto"))
                .andExpect(jsonPath("$.title").value("Share trip"))
                .andExpect(jsonPath("$.days[0].items[0].placeName").value("Kinkaku-ji"));

        // Unknown token -> consistent 404 JSON envelope.
        mockMvc.perform(get("/api/shared/trips/ffffffffffffffffffffffffffffffffffffffffffffffff"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.timestamp").isString());

        // A non-owner cannot generate a share token for Alice's trip.
        mockMvc.perform(post("/api/trips/" + tripId + "/share")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // The token is non-guessable: 48 lowercase hex chars.
        org.assertj.core.api.Assertions.assertThat(shareToken)
                .matches("^[0-9a-f]{48}$");
    }

    @Test
    void sharingStillRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/trips/1/share"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ----------------------------------------------------------------

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Share Tester","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long createTrip(String token, String destination) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Share trip",
                                  "destination": "%s",
                                  "startDate": "2026-09-01",
                                  "endDate": "2026-09-03",
                                  "travelers": 2,
                                  "budget": 1500.00,
                                  "travelStyle": "CULTURAL",
                                  "days": [
                                    {
                                      "dayNumber": 1,
                                      "date": "2026-09-01",
                                      "items": [
                                        {"placeName": "Kinkaku-ji", "estimatedCost": 8, "visitDuration": 90}
                                      ]
                                    }
                                  ]
                                }
                                """.formatted(destination)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(created.getResponse().getContentAsString());
        return json.get("id").asLong();
    }
}
