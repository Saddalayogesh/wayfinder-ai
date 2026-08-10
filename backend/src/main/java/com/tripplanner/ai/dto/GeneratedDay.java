package com.tripplanner.ai.dto;

import java.util.List;

/**
 * A generated itinerary day, identified by its day number (1-based).
 */
public record GeneratedDay(
        Integer day,
        List<GeneratedActivity> activities
) {
}
