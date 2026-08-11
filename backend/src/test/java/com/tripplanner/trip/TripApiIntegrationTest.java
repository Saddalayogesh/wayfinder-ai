package com.tripplanner.trip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end trip management over the real security chain + H2:
 * CRUD, cross-user 403s, cascade delete, and validation.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TripApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // --- Full happy path + ownership ------------------------------------------

    @Test
    void tripCrudWithOwnershipAndCascade() throws Exception {
        // Two users register; each gets a JWT.
        String tokenA = register("alice@example.com");
        String tokenB = register("bob@example.com");

        // Alice creates a trip with one day and one item (structured CRUD).
        String createBody = """
                {
                  "title": "Summer in Japan",
                  "destination": "Tokyo",
                  "startDate": "2026-08-15",
                  "endDate": "2026-08-22",
                  "travelers": 2,
                  "budget": 3500.00,
                  "travelStyle": "ADVENTURE",
                  "interests": ["Food", "Culture"],
                  "days": [
                    {
                      "dayNumber": 1,
                      "date": "2026-08-15",
                      "items": [
                        {
                          "placeName": "Senso-ji Temple",
                          "description": "Historic temple",
                          "latitude": 35.7148,
                          "longitude": 139.7967,
                          "estimatedCost": 10.50,
                          "visitDuration": 120,
                          "sequenceOrder": 1
                        }
                      ]
                    }
                  ]
                }
                """;
        MvcResult created = mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.destination").value("Tokyo"))
                .andExpect(jsonPath("$.days[0].items[0].placeName").value("Senso-ji Temple"))
                .andReturn();
        JsonNode tripJson = objectMapper.readTree(created.getResponse().getContentAsString());
        long tripId = tripJson.get("id").asLong();
        long dayId = tripJson.get("days").get(0).get("id").asLong();
        long itemId = tripJson.get("days").get(0).get("items").get(0).get("id").asLong();

        // Bob cannot read, update, delete, or mutate Alice's trip -> 403.
        mockMvc.perform(get("/api/trips/" + tripId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        mockMvc.perform(put("/api/trips/" + tripId)
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/trips/" + tripId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/trips/" + tripId + "/days")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date":"2026-08-16"}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/trips/" + tripId + "/days/" + dayId + "/items")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"placeName":"Somewhere"}
                                """))
                .andExpect(status().isForbidden());

        // Bob's list is empty; Alice sees her trip.
        mockMvc.perform(get("/api/trips").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/trips").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(tripId));

        // Alice updates trip fields (no 'days' -> itinerary preserved).
        mockMvc.perform(put("/api/trips/" + tripId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Summer in Japan (updated)",
                                  "destination": "Tokyo",
                                  "startDate": "2026-08-15",
                                  "endDate": "2026-08-22",
                                  "travelers": 4,
                                  "budget": 5000.00,
                                  "travelStyle": "RELAXED",
                                  "interests": ["Food", "Nature"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Summer in Japan (updated)"))
                .andExpect(jsonPath("$.travelers").value(4))
                .andExpect(jsonPath("$.days[0].items[0].placeName").value("Senso-ji Temple"));

        // Alice adds a day and an item, then removes the item.
        mockMvc.perform(post("/api/trips/" + tripId + "/days")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date":"2026-08-16"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days.length()").value(2));
        mockMvc.perform(post("/api/trips/" + tripId + "/days/" + dayId + "/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"placeName":"Tokyo Skytree","estimatedCost":20,"visitDuration":90}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].items.length()").value(2));
        mockMvc.perform(delete("/api/trips/" + tripId + "/days/" + dayId + "/items/" + itemId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].items[0].placeName").value("Tokyo Skytree"));

        // Cascade: deleting the trip removes days, items, and interests rows.
        int daysBefore = countRows("trip_days", "trip_id", tripId);
        int itemsBefore = countRows("itinerary_items", "trip_day_id", dayId);
        int interestsBefore = countRows("trip_interests", "trip_id", tripId);
        assertThat(daysBefore).isGreaterThan(0);
        assertThat(itemsBefore).isGreaterThan(0);
        assertThat(interestsBefore).isGreaterThan(0);

        mockMvc.perform(delete("/api/trips/" + tripId).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        assertThat(countRows("trips", "id", tripId)).isZero();
        assertThat(countRows("trip_days", "trip_id", tripId)).isZero();
        assertThat(countRows("itinerary_items", "trip_day_id", dayId)).isZero();
        assertThat(countRows("trip_interests", "trip_id", tripId)).isZero();

        mockMvc.perform(get("/api/trips/" + tripId).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    // --- Validation -------------------------------------------------------------

    @Test
    void invalidPayloadsReturn400() throws Exception {
        String token = register("validation@example.com");

        // budget must be > 0
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody().replace("\"budget\": 3500.00", "\"budget\": 0")))
                .andExpect(status().isBadRequest());

        // travelers must be > 0
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody().replace("\"travelers\": 2", "\"travelers\": 0")))
                .andExpect(status().isBadRequest());

        // endDate before startDate
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody().replace("\"endDate\": \"2026-08-22\"", "\"endDate\": \"2026-08-10\"")))
                .andExpect(status().isBadRequest());

        // blank destination
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody().replace("\"destination\": \"Tokyo\"", "\"destination\": \" \"")))
                .andExpect(status().isBadRequest());

        // protected routes still reject missing JWTs
        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ----------------------------------------------------------------

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test User","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String validBody() {
        return """
                {
                  "title": "Summer in Japan",
                  "destination": "Tokyo",
                  "startDate": "2026-08-15",
                  "endDate": "2026-08-22",
                  "travelers": 2,
                  "budget": 3500.00,
                  "travelStyle": "ADVENTURE",
                  "interests": ["Food", "Culture"]
                }
                """;
    }

    private int countRows(String table, String column, long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?", Integer.class, id);
        return count == null ? 0 : count;
    }
}
