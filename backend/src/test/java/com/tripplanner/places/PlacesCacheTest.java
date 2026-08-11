package com.tripplanner.places;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves the places cache works: the second search for the same destination
 * is served from the cache, so the underlying places client (mocked here) is
 * invoked only once. Uses the in-memory cache manager so no Redis is needed.
 */
@SpringBootTest(properties = "spring.cache.type=simple")
@AutoConfigureMockMvc
class PlacesCacheTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private PlacesService placesService;

    @BeforeEach
    void clearPlacesCache() {
        Cache cache = cacheManager.getCache("places");
        if (cache != null) {
            cache.clear();
        }
    }

    @Test
    void repeatedSearchForSameDestinationInvokesClientOnlyOnce() throws Exception {
        when(placesService.searchPlaces("Tokyo", 5)).thenReturn(List.of(place("Tokyo Tower")));
        String token = register("cache.tokyo@example.com");

        // 1st search: cache miss -> client called, result stored.
        mockMvc.perform(get("/api/places/search")
                        .param("destination", "Tokyo")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tokyo Tower"));

        // 2nd search with the same destination: cache hit -> client NOT called.
        mockMvc.perform(get("/api/places/search")
                        .param("destination", "Tokyo")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tokyo Tower"));

        // The underlying client was invoked exactly once for this destination.
        verify(placesService, times(1)).searchPlaces("Tokyo", 5);
    }

    @Test
    void emptyResultsAreNotCached() throws Exception {
        // An empty result (e.g. transient provider outage) must NOT be cached:
        // the next search re-queries the client instead of being served a
        // stale empty list for 24 hours.
        when(placesService.searchPlaces("Nowhereville", 5)).thenReturn(List.of());
        String token = register("cache.empty@example.com");

        mockMvc.perform(get("/api/places/search").param("destination", "Nowhereville")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/places/search").param("destination", "Nowhereville")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // The client was hit both times — the empty result was never cached.
        verify(placesService, times(2)).searchPlaces("Nowhereville", 5);
    }

    @Test
    void differentDestinationsGetSeparateCacheEntries() throws Exception {
        when(placesService.searchPlaces("Tokyo", 5)).thenReturn(List.of(place("Tokyo Tower")));
        when(placesService.searchPlaces("Osaka", 5)).thenReturn(List.of(place("Osaka Castle")));
        String token = register("cache.multi@example.com");

        mockMvc.perform(get("/api/places/search").param("destination", "Tokyo")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/places/search").param("destination", "Osaka")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        // Repeating Tokyo hits its own cache entry.
        mockMvc.perform(get("/api/places/search").param("destination", "Tokyo")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        verify(placesService, times(1)).searchPlaces("Tokyo", 5);
        verify(placesService, times(1)).searchPlaces("Osaka", 5);
    }

    private PlaceResult place(String name) {
        return new PlaceResult("osm:way:1", name, new BigDecimal("35.65"), new BigDecimal("139.74"),
                "Tokyo", null, null);
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Cache User","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
