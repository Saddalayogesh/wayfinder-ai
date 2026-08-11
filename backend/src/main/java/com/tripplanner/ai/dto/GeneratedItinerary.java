package com.tripplanner.ai.dto;

import java.util.List;

/**
 * A fully parsed, validated itinerary returned by Gemini.
 */
public record GeneratedItinerary(
        String destination,
        List<GeneratedDay> days
) {
}
