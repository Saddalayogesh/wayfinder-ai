package com.tripplanner.places;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the app runs fully functional with zero paid keys out of the box:
 * with the default configuration (no {@code GOOGLE_PLACES_API_KEY},
 * {@code places.provider} unset), the active provider is the free
 * {@link OsmPlacesClient} and the Google client is not registered at all.
 */
@SpringBootTest
class PlacesProviderFallbackTest {

    @Autowired
    private PlacesService placesService;

    @Autowired(required = false)
    private GooglePlacesClient googlePlacesClient;

    @Autowired
    private OsmPlacesClient osmPlacesClient;

    @Test
    void fallsBackToOsmPlacesClientWhenGoogleKeyIsNotConfigured() {
        // The single active PlacesService bean is the OSM implementation.
        assertThat(placesService).isInstanceOf(OsmPlacesClient.class);
        assertThat(placesService).isSameAs(osmPlacesClient);

        // The Google client is not even registered as a bean.
        assertThat(googlePlacesClient).isNull();

        // And it is actually usable: geocoding a well-known place resolves.
        assertThat(placesService.geocode("Eiffel Tower")).isPresent();
    }

    /** When google is explicitly selected, the switch flips the other way. */
    @SpringBootTest(properties = "places.provider=google")
    static class GoogleProviderEnabledTest {

        @Autowired
        private PlacesService placesService;

        @Test
        void googleClientActiveWhenProviderIsGoogle() {
            assertThat(placesService).isInstanceOf(GooglePlacesClient.class);
        }
    }
}
