package com.tripplanner.places;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.tripplanner.exception.PlaceNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the OSM/Nominatim client, driven against an in-process HTTP
 * stub — the real Nominatim API is never touched. Covers the JSON parsing,
 * the graceful degradation on provider errors, and the place-id conversion.
 */
class OsmPlacesClientTest {

    private HttpServer server;
    private OsmPlacesClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.start();
        client = new OsmPlacesClient(
                "http://127.0.0.1:" + server.getAddress().getPort(),
                "wayfinder-ai-test/1.0",
                new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    /** Serves {@code body} with {@code statusCode} for the exact given paths. */
    private void stubResponse(int statusCode, String body, String... paths) {
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            for (String candidate : paths) {
                if (path.equals(candidate)) {
                    byte[] bytes = body.getBytes();
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(statusCode, bytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(bytes);
                    }
                    return;
                }
            }
            exchange.sendResponseHeaders(404, -1);
            exchange.close();
        });
    }

    @Test
    void searchParsesNominatimJsonAndSkipsEntriesWithoutNames() {
        stubResponse(200, """
                [
                  {"osm_type":"way","osm_id":5013364,"lat":"48.8584","lon":"2.2945","name":"Eiffel Tower","display_name":"Eiffel Tower, Paris"},
                  {"osm_type":"node","osm_id":11,"lat":"48.86","lon":"2.30","name":"","display_name":"unnamed node"},
                  {"osm_type":"relation","osm_id":7,"lat":"1.0","lon":"2.0","name":"Zone"}
                ]
                """, "/search");

        List<PlaceResult> results = client.searchPlaces("Eiffel Tower", 5);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).id()).isEqualTo("osm:way:5013364");
        assertThat(results.get(0).name()).isEqualTo("Eiffel Tower");
        assertThat(results.get(0).latitude()).isEqualByComparingTo("48.8584");
        assertThat(results.get(0).longitude()).isEqualByComparingTo("2.2945");
        assertThat(results.get(1).id()).isEqualTo("osm:relation:7");
    }

    @Test
    void searchNetworkErrorDegradesToEmptyList() {
        stubResponse(500, "boom", "/search");

        // A provider outage must never break the app.
        assertThat(client.searchPlaces("Nowhere", 5)).isEmpty();
    }

    @Test
    void getPlaceResolvesOsmLookup() {
        stubResponse(200, """
                [{"osm_type":"way","osm_id":5013364,"lat":"48.8584","lon":"2.2945","name":"Eiffel Tower","display_name":"Paris"}]
                """, "/lookup");

        PlaceResult place = client.getPlace("osm:way:5013364");

        assertThat(place.id()).isEqualTo("osm:way:5013364");
        assertThat(place.name()).isEqualTo("Eiffel Tower");
        assertThat(place.rating()).isNull();
    }

    @Test
    void getPlaceWithUnknownIdThrows404WithoutCallingTheApi() {
        assertThatThrownBy(() -> client.getPlace("totally-unknown-id"))
                .isInstanceOf(PlaceNotFoundException.class);
    }

    @Test
    void getPlaceNetworkErrorBecomes404() {
        stubResponse(500, "boom", "/lookup");

        assertThatThrownBy(() -> client.getPlace("osm:way:5013364"))
                .isInstanceOf(PlaceNotFoundException.class);
    }

    @Test
    void geocodeReturnsFirstResult() {
        stubResponse(200, """
                [{"osm_type":"node","osm_id":1,"lat":"35.0","lon":"135.0","name":"Shibuya","display_name":"Tokyo"}]
                """, "/search");

        Optional<GeoPoint> point = client.geocode("Shibuya");

        assertThat(point).isPresent();
        assertThat(point.get().latitude()).isEqualByComparingTo("35.0");
        assertThat(point.get().longitude()).isEqualByComparingTo("135.0");
    }

    @Test
    void geocodeReturnsEmptyWhenNoResults() {
        stubResponse(200, "[]", "/search");

        assertThat(client.geocode("Nowhere")).isEmpty();
    }

    @Test
    void toOsmLookupIdConvertsSupportedOsmTypesAndRejectsJunk() {
        assertThat(OsmPlacesClient.toOsmLookupId("osm:node:123")).isEqualTo("N123");
        assertThat(OsmPlacesClient.toOsmLookupId("osm:way:5013364")).isEqualTo("W5013364");
        assertThat(OsmPlacesClient.toOsmLookupId("osm:relation:99")).isEqualTo("R99");
        assertThat(OsmPlacesClient.toOsmLookupId("osm:way:")).isNull();
        assertThat(OsmPlacesClient.toOsmLookupId("osm:station:1")).isNull();
        assertThat(OsmPlacesClient.toOsmLookupId("osm:way:12a")).isNull();
        assertThat(OsmPlacesClient.toOsmLookupId("https://osm.org/way/1")).isNull();
        assertThat(OsmPlacesClient.toOsmLookupId(null)).isNull();
    }
}
