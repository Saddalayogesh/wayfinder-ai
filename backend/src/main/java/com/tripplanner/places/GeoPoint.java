package com.tripplanner.places;

import java.math.BigDecimal;

/**
 * A latitude/longitude coordinate pair.
 */
public record GeoPoint(
        BigDecimal latitude,
        BigDecimal longitude
) {
}
