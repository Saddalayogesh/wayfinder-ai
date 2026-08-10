package com.tripplanner.places;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link GooglePlacesClient} response parsing. The Google API
 * is never called (no key, no HTTP) — only the parser is exercised with
 * captured response shapes, so the Google provider's parsing is verified even
 * though it cannot be tested live in this environment.
 */
class GooglePlacesClientTest {

    private static final String FAKE_KEY = "AIza-fake-key-for-parsing-tests";

    private ObjectMapper objectMapper;
    private GooglePlacesClient client;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        client = new GooglePlacesClient(FAKE_KEY, "https://places.googleapis.com", objectMapper);
    }

    @Test
    void parsesFullSearchResult() throws Exception {
        JsonNode place = objectMapper.readTree("""
                {
                  "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
                  "displayName": { "text": "Tokyo Tower" },
                  "formattedAddress": "4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan",
                  "location": { "latitude": 35.6585805, "longitude": 139.7454329 },
                  "rating": 4.4,
                  "photos": [
                    { "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUc7tXUqz3PLpM", "widthPx": 1000 }
                  ]
                }
                """);

        PlaceResult result = client.toPlaceResult(place);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo("ChIJN1t_tDeuEmsRUsoyG83frY4");
        assertThat(result.name()).isEqualTo("Tokyo Tower");
        assertThat(result.latitude()).isEqualByComparingTo(new BigDecimal("35.6585805"));
        assertThat(result.longitude()).isEqualByComparingTo(new BigDecimal("139.7454329"));
        assertThat(result.rating()).isEqualByComparingTo(new BigDecimal("4.4"));
        // The photo points at our backend proxy — the API key must NEVER appear.
        assertThat(result.photoUrl()).isEqualTo(
                "/api/places/ChIJN1t_tDeuEmsRUsoyG83frY4/photo?maxWidthPx=400");
        assertThat(result.photoUrl()).doesNotContain(FAKE_KEY);
        assertThat(result.address()).contains("Shibakoen");
    }

    @Test
    void resultWithoutCoordinatesIsSkipped() throws Exception {
        JsonNode place = objectMapper.readTree("""
                {
                  "id": "ChIJABC",
                  "displayName": { "text": "No Location" },
                  "location": {}
                }
                """);

        assertThat(client.toPlaceResult(place)).isNull();
    }

    @Test
    void resultWithoutPhotosHasNullPhotoUrl() throws Exception {
        JsonNode place = objectMapper.readTree("""
                {
                  "id": "ChIJXYZ",
                  "displayName": { "text": "No Photos" },
                  "location": { "latitude": 1.0, "longitude": 2.0 }
                }
                """);

        PlaceResult result = client.toPlaceResult(place);

        assertThat(result).isNotNull();
        assertThat(result.photoUrl()).isNull();
    }

    @Test
    void nullAndMissingNodesReturnNull() {
        assertThat(client.toPlaceResult(null)).isNull();
        assertThat(client.toPlaceResult(objectMapper.missingNode())).isNull();
    }
}
