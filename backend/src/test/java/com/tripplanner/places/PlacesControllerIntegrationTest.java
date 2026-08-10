package com.tripplanner.places;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.exception.PlaceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PlacesControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PlacesService placesService;

    @Test
    void searchReturnsMatchingPlaces() throws Exception {
        when(placesService.searchPlaces("Tokyo", 5)).thenReturn(List.of(
                new PlaceResult("osm:way/1", "Tokyo Tower", new BigDecimal("35.6586"),
                        new BigDecimal("139.7454"), "Shiba Koen, Minato City, Tokyo", null, null)));

        mockMvc.perform(get("/api/places/search")
                        .param("destination", "Tokyo")
                        .header("Authorization", "Bearer " + register("places.search@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tokyo Tower"))
                .andExpect(jsonPath("$[0].id").value("osm:way/1"))
                .andExpect(jsonPath("$[0].latitude").value(35.6586));
    }

    @Test
    void searchWithoutDestinationReturns400() throws Exception {
        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", "Bearer " + register("places.nodest@example.com")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPlaceReturnsDetails() throws Exception {
        when(placesService.getPlace("osm:way:1")).thenReturn(
                new PlaceResult("osm:way:1", "Tokyo Tower", new BigDecimal("35.6586"),
                        new BigDecimal("139.7454"), "Tokyo", new BigDecimal("4.6"), null));

        mockMvc.perform(get("/api/places/osm:way:1")
                        .header("Authorization", "Bearer " + register("places.details@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tokyo Tower"))
                .andExpect(jsonPath("$.rating").value(4.6));
    }

    @Test
    void getUnknownPlaceReturns404() throws Exception {
        when(placesService.getPlace(anyString()))
                .thenThrow(new PlaceNotFoundException("Place not found: nope"));

        mockMvc.perform(get("/api/places/nope")
                        .header("Authorization", "Bearer " + register("places.missing@example.com")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void placesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/places/search").param("destination", "Tokyo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void photoReturnsProxiedBytesWithoutAuth() throws Exception {
        when(placesService.getPhoto("osm:way:1", 400))
                .thenReturn(Optional.of(new PlacePhoto(new byte[]{1, 2, 3}, "image/jpeg")));

        mockMvc.perform(get("/api/places/osm:way:1/photo").param("maxWidthPx", "400"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/jpeg"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
    }

    @Test
    void photoWithoutProviderPhotoReturns404() throws Exception {
        when(placesService.getPhoto(anyString(), anyInt())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/places/osm:way:1/photo"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Places User","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
