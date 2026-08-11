package com.tripplanner.places;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.exception.PlaceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Places provider backed by the Google Places API (new, v1). Requires a
 * {@code GOOGLE_PLACES_API_KEY} and is active only when
 * {@code places.provider=google}. When the key is missing the client stays
 * inert (empty searches, empty geocoding) rather than breaking the app.
 *
 * <p>Photo URLs point back at our own {@code /api/places/{id}/photo} proxy so
 * the API key is never exposed to the browser.</p>
 */
@Service
@ConditionalOnProperty(name = "places.provider", havingValue = "google")
public class GooglePlacesClient implements PlacesService {

    private static final Logger log = LoggerFactory.getLogger(GooglePlacesClient.class);
    private static final String SEARCH_FIELD_MASK =
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos";
    private static final String DETAILS_FIELD_MASK =
            "id,displayName,formattedAddress,location,rating,photos";
    private static final String PHOTO_FIELD_MASK = "id,photos";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    public GooglePlacesClient(@Value("${google.places.api-key:}") String apiKey,
                              @Value("${google.places.base-url:https://places.googleapis.com}") String baseUrl,
                              ObjectMapper objectMapper) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(10_000);
        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    @Override
    public List<PlaceResult> searchPlaces(String query, int limit) {
        if (apiKey.isBlank()) {
            log.warn("places.provider=google but GOOGLE_PLACES_API_KEY is not set; returning no results");
            return List.of();
        }
        try {
            JsonNode root = restClient.post()
                    .uri("/v1/places:searchText")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", SEARCH_FIELD_MASK)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("textQuery", query, "maxResultCount", Math.min(Math.max(limit, 1), 20)))
                    .retrieve()
                    .body(JsonNode.class);

            List<PlaceResult> results = new ArrayList<>();
            JsonNode places = root == null ? null : root.get("places");
            if (places != null && places.isArray()) {
                for (JsonNode place : places) {
                    PlaceResult result = toPlaceResult(place);
                    if (result != null) {
                        results.add(result);
                    }
                }
            }
            return results;
        } catch (RestClientException e) {
            log.warn("Google Places search failed", e);
            return List.of();
        }
    }

    @Override
    public PlaceResult getPlace(String placeId) {
        if (apiKey.isBlank()) {
            throw new PlaceNotFoundException("Place not found: " + placeId);
        }
        try {
            JsonNode place = restClient.get()
                    .uri("/v1/places/{placeId}", placeId)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", DETAILS_FIELD_MASK)
                    .retrieve()
                    .body(JsonNode.class);
            PlaceResult result = toPlaceResult(place);
            if (result == null) {
                throw new PlaceNotFoundException("Place not found: " + placeId);
            }
            return result;
        } catch (RestClientResponseException e) {
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
        if (apiKey.isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode place = restClient.get()
                    .uri("/v1/places/{placeId}", placeId)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", PHOTO_FIELD_MASK)
                    .retrieve()
                    .body(JsonNode.class);
            String photoName = firstPhotoName(place);
            if (photoName == null) {
                return Optional.empty();
            }
            ResponseEntity<byte[]> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/v1/" + photoName + "/media")
                            .queryParam("maxWidthPx", Math.min(Math.max(maxWidthPx, 50), 1600))
                            .build())
                    .header("X-Goog-Api-Key", apiKey)
                    .retrieve()
                    .toEntity(byte[].class);
            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                return Optional.empty();
            }
            String contentType = response.getHeaders().getContentType() != null
                    ? response.getHeaders().getContentType().toString()
                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return Optional.of(new PlacePhoto(body, contentType));
        } catch (RestClientException e) {
            log.warn("Google Places photo fetch failed for {}", placeId);
            return Optional.empty();
        }
    }

    /** Package-private for unit testing the response parsing. */
    PlaceResult toPlaceResult(JsonNode place) {
        if (place == null || place.isNull() || place.isMissingNode()) {
            return null;
        }
        String id = place.path("id").asText("");
        String name = place.path("displayName").path("text").asText("");
        JsonNode location = place.path("location");
        BigDecimal lat = decimal(location.path("latitude"));
        BigDecimal lng = decimal(location.path("longitude"));
        if (id.isBlank() || name.isBlank() || lat == null || lng == null) {
            return null;
        }
        BigDecimal rating = decimal(place.path("rating"));
        String photoUrl = null;
        if (firstPhotoName(place) != null && !apiKey.isBlank()) {
            // Point at our backend proxy so the API key stays server-side.
            photoUrl = "/api/places/" + id + "/photo?maxWidthPx=400";
        }
        return new PlaceResult(
                id,
                name,
                lat,
                lng,
                place.path("formattedAddress").asText(""),
                rating,
                photoUrl);
    }

    private static String firstPhotoName(JsonNode place) {
        if (place == null) {
            return null;
        }
        JsonNode photos = place.get("photos");
        if (photos == null || !photos.isArray() || photos.isEmpty()) {
            return null;
        }
        String photoName = photos.get(0).path("name").asText("");
        return photoName.isBlank() ? null : photoName;
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
