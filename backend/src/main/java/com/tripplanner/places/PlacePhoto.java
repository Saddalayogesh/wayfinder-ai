package com.tripplanner.places;

/**
 * Raw photo bytes served by a PlacesService provider, proxied through the
 * backend so provider API keys never reach the browser.
 */
public record PlacePhoto(byte[] data, String contentType) {
}
