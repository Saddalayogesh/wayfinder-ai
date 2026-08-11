package com.tripplanner.places;

import java.util.List;
import java.util.Optional;

/**
 * Abstraction over a places/geocoding provider. Implementations:
 * <ul>
 *   <li>{@link OsmPlacesClient} — OpenStreetMap Nominatim, free, no key
 *       (default when {@code places.provider} is unset or {@code osm}).</li>
 *   <li>{@link GooglePlacesClient} — Google Places API, needs
 *       {@code GOOGLE_PLACES_API_KEY} ({@code places.provider=google}).</li>
 * </ul>
 */
public interface PlacesService {

    /** Searches for places matching the query, capped at {@code limit}. */
    List<PlaceResult> searchPlaces(String query, int limit);

    /** Fetches a single place by provider-specific id (e.g. {@code osm:way:5013364}). */
    PlaceResult getPlace(String placeId);

    /**
     * Best-effort geocoding of a free-text place name. Used to fill in
     * latitude/longitude for itinerary items the AI left without coordinates.
     * Implementations return {@link Optional#empty()} when they cannot resolve
     * the name — callers must treat that as "no coordinates", never as an error.
     */
    Optional<GeoPoint> geocode(String name);

    /**
     * Fetches the raw bytes of a place's photo, proxied through the backend
     * so provider API keys never leave the server. Providers without photos
     * return {@link Optional#empty()}.
     */
    Optional<PlacePhoto> getPhoto(String placeId, int maxWidthPx);
}
