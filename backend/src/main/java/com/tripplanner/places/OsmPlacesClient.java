package com.tripplanner.places;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.exception.PlaceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Places provider backed by OpenStreetMap's free Nominatim API. No API key
 * required, so the app is fully functional out of the box.
 *
 * <p>Active when {@code places.provider} is {@code osm} (the default).</p>
 *
 * <p>Nominatim usage policy: a descriptive {@code User-Agent} must be sent
 * and traffic must stay modest (max ~1 request/second).</p>
 */
@Service
@ConditionalOnProperty(name = "places.provider", havingValue = "osm", matchIfMissing = true)
public class OsmPlacesClient implements PlacesService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OsmPlacesClient(@Value("${places.nominatim.base-url:https://nominatim.openstreetmap.org}") String baseUrl,
                           @Value("${places.nominatim.user-agent:AI-Trip-Planner/0.1}") String userAgent,
                           ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(10_000);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("User-Agent", userAgent)
                .build();
    }

    @Override
    public List<PlaceResult> searchPlaces(String query, int limit) {
        try {
            JsonNode root = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/search")
                            .queryParam("format", "jsonv2")
                            .queryParam("q", query)
                            .queryParam("limit", Math.min(Math.max(limit, 1), 20))
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            List<PlaceResult> results = new ArrayList<>();
            if (root != null && root.isArray()) {
                for (JsonNode node : root) {
                    PlaceResult place = toPlaceResult(node);
                    if (place != null) {
                        results.add(place);
                    }
                }
            }
            return results;
        } catch (RestClientException e) {
            // A provider outage must never break the app.
            return List.of();
        }
    }

    @Override
    public PlaceResult getPlace(String placeId) {
        // Our ids look like "osm:way:5013364". Nominatim's lookup endpoint
        // takes osm ids as "W5013364" (N=node, W=way, R=relation).
        String osmLookupId = toOsmLookupId(placeId);
        if (osmLookupId == null) {
            throw new PlaceNotFoundException("Place not found: " + placeId);
        }
        try {
            JsonNode root = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/lookup")
                            .queryParam("format", "jsonv2")
                            .queryParam("osm_ids", osmLookupId)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            if (root != null && root.isArray() && !root.isEmpty()) {
                PlaceResult place = toPlaceResult(root.get(0));
                if (place != null) {
                    return place;
                }
            }
            throw new PlaceNotFoundException("Place not found: " + placeId);
        } catch (RestClientException e) {
            throw new PlaceNotFoundException("Place not found: " + placeId);
        }
    }

    @Override
    public Optional<GeoPoint> geocode(String name) {
        List<PlaceResult> results = searchPlaces(name, 1);
        if (results.isEmpty()) {
            return Optional.empty();
        }
        PlaceResult first = results.get(0);
        return Optional.of(new GeoPoint(first.latitude(), first.longitude()));
    }

    @Override
    public Optional<PlacePhoto> getPhoto(String placeId, int maxWidthPx) {
        // Nominatim has no photos.
        return Optional.empty();
    }

    private PlaceResult toPlaceResult(JsonNode node) {
        String osmType = node.path("osm_type").asText("");
        String osmId = node.path("osm_id").asText("");
        BigDecimal lat = decimal(node.path("lat"));
        BigDecimal lon = decimal(node.path("lon"));
        String name = node.path("name").asText("");
        if (name.isBlank() || lat == null || lon == null) {
            return null;
        }
        return new PlaceResult(
                "osm:" + osmType + ":" + osmId,
                name,
                lat,
                lon,
                node.path("display_name").asText(""),
                null, // Nominatim has no ratings
                null  // or photos
        );
    }

    /** Converts "osm:way:5013364" to "W5013364", or null when unrecognized. */
    static String toOsmLookupId(String placeId) {
        if (placeId == null || !placeId.startsWith("osm:")) {
            return null;
        }
        String[] parts = placeId.split(":"); // [osm, way, 5013364]
        if (parts.length != 3 || parts[0].isEmpty() || parts[1].isEmpty() || parts[2].isEmpty()) {
            return null;
        }
        String code = switch (parts[1]) {
            case "node" -> "N";
            case "way" -> "W";
            case "relation" -> "R";
            default -> null;
        };
        if (code == null || !parts[2].chars().allMatch(Character::isDigit)) {
            return null;
        }
        return code + parts[2];
    }

    private BigDecimal decimal(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }
        try {
            return new BigDecimal(node.asText());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
