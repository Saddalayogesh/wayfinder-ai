package com.tripplanner.ai.dto;

import java.math.BigDecimal;

/**
 * A single activity produced by Gemini. Optional numeric fields are null
 * when the model did not provide them.
 */
public record GeneratedActivity(
        String name,
        Integer duration,
        BigDecimal estimatedCost,
        BigDecimal latitude,
        BigDecimal longitude
) {
}
