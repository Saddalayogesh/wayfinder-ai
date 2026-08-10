package com.tripplanner.trip;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Snapshot of a trip's context handed to the AI when regenerating a single
 * day: identity fields plus a compact summary of the whole itinerary so the
 * new plan stays consistent with the other days.
 */
public record RegenerateContext(
        String destination,
        BigDecimal budget,
        String travelStyle,
        Set<String> interests,
        String itinerarySummary
) {
}
