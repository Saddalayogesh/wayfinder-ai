package com.tripplanner.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin cache-eviction endpoint: ADMIN can clear the places cache (the
 * next search re-queries the provider), and non-admin tokens get 403.
 */
@SpringBootTest(properties = "spring.cache.type=simple")
@AutoConfigureMockMvc
class AdminCacheEvictTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private com.tripplanner.places.PlacesService placesService;

    @BeforeEach
    void clearPlacesCache() {
        Cache cache = cacheManager.getCache("places");
        if (cache != null) {
            cache.clear();
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminEvictionForcesTheNextSearchToHitTheClientAgain() throws Exception {
        when(placesService.searchPlaces("Kyoto", 5)).thenReturn(List.of(place("Kinkaku-ji")));

        // Seed the cache with a search.
        mockMvc.perform(get("/api/places/search").param("destination", "Kyoto"))
                .andExpect(status().isOk());
        verify(placesService, times(1)).searchPlaces("Kyoto", 5);

        // Admin evicts the whole places cache.
        mockMvc.perform(delete("/api/admin/cache/places"))
                .andExpect(status().isNoContent());

        // The next search is a miss again and calls the client a second time.
        mockMvc.perform(get("/api/places/search").param("destination", "Kyoto"))
                .andExpect(status().isOk());
        verify(placesService, times(2)).searchPlaces("Kyoto", 5);
    }

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminCannotEvictTheCache() throws Exception {
        mockMvc.perform(delete("/api/admin/cache/places"))
                .andExpect(status().isForbidden());
    }

    private com.tripplanner.places.PlaceResult place(String name) {
        return new com.tripplanner.places.PlaceResult("osm:way:2", name,
                new BigDecimal("35.01"), new BigDecimal("135.76"), "Kyoto", null, null);
    }
}
