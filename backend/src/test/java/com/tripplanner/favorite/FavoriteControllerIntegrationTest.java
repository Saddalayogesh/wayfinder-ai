package com.tripplanner.favorite;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end favorites CRUD with the real security chain and persistence. */
@SpringBootTest
@AutoConfigureMockMvc
class FavoriteControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void addListAndRemoveFavorite() throws Exception {
        String token = register("fav.e2e@example.com");

        // Add two favorites.
        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"osm:way:1\",\"placeName\":\"Tour Eiffel\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.placeName").value("Tour Eiffel"));
        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"osm:way:2\",\"placeName\":\"Colosseo\"}"))
                .andExpect(status().isCreated());

        // List returns both, newest first.
        MvcResult list = mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].placeName").value("Colosseo"))
                .andReturn();

        long favoriteId = objectMapper.readTree(list.getResponse().getContentAsString())
                .get(0).get("id").asLong();

        // Remove it.
        mockMvc.perform(delete("/api/favorites/" + favoriteId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/favorites").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void favoritingTheSamePlaceTwiceIsIdempotent() throws Exception {
        String token = register("fav.idem@example.com");

        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"osm:way:5\",\"placeName\":\"Senso-ji\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"osm:way:5\",\"placeName\":\"Senso-ji\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/favorites").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void cannotRemoveAnotherUsersFavorite() throws Exception {
        String owner = register("fav.owner@example.com");
        String intruder = register("fav.intruder@example.com");

        MvcResult added = mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"osm:way:9\",\"placeName\":\"Kinkaku-ji\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long favoriteId = objectMapper.readTree(added.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/favorites/" + favoriteId)
                        .header("Authorization", "Bearer " + intruder))
                .andExpect(status().isForbidden());
    }

    @Test
    void favoritesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
    }

    @Test
    void removingUnknownFavoriteReturns404() throws Exception {
        String token = register("fav.missing@example.com");

        mockMvc.perform(delete("/api/favorites/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Fav User","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
