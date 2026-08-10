package com.tripplanner.trip.dto;

import com.tripplanner.trip.ItineraryItem;
import com.tripplanner.trip.Trip;
import com.tripplanner.trip.TripDay;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Budget summary computed from a trip's itinerary: total estimated cost,
 * remaining budget, and per-category sums. Categories are assigned by a
 * keyword heuristic on each item's name/description (default "activities").
 */
@Schema(description = "Budget summary: estimated total, remaining budget, and per-category breakdown")
public record CostBreakdown(
        @Schema(example = "1234.50") BigDecimal estimatedTotal,
        @Schema(example = "765.50", nullable = true) BigDecimal remaining,
        @Schema(description = "Sums per heuristic category: accommodation, food, activities, transport")
        Map<String, BigDecimal> breakdown
) {

    private static final List<String> CATEGORIES = List.of("accommodation", "food", "activities", "transport");

    /** Computes the breakdown from a trip's itinerary. Costs are USD. */
    public static CostBreakdown from(Trip trip) {
        BigDecimal estimatedTotal = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        CATEGORIES.forEach(category -> byCategory.put(category, BigDecimal.ZERO));
        for (TripDay day : trip.getDays()) {
            for (ItineraryItem item : day.getItems()) {
                if (item.getEstimatedCost() == null) {
                    continue; // unknown costs are treated as free, never as errors
                }
                estimatedTotal = estimatedTotal.add(item.getEstimatedCost());
                byCategory.merge(categorize(item), item.getEstimatedCost(), BigDecimal::add);
            }
        }
        BigDecimal remaining = trip.getBudget() == null ? null : trip.getBudget().subtract(estimatedTotal);
        return new CostBreakdown(estimatedTotal, remaining, byCategory);
    }

    /** Rough heuristic: keyword match on name/description; everything else is an activity. */
    private static String categorize(ItineraryItem item) {
        String name = (item.getPlaceName() == null ? "" : item.getPlaceName()) + " "
                + (item.getDescription() == null ? "" : item.getDescription());
        String lower = name.toLowerCase();
        if (containsAny(lower, "hotel", "hostel", "resort", "lodge", "ryokan", " inn", "stay", "villa",
                "airbnb", "guesthouse", "bnb")) {
            return "accommodation";
        }
        if (containsAny(lower, "restaurant", "cafe", "caf\u00e9", "food", "dinner", "lunch", "breakfast",
                "brunch", "bakery", "bistro", "street food", "market", "sushi", "ramen", "dining",
                "eatery", "snack", "brewery")) {
            return "food";
        }
        if (containsAny(lower, "train", "bus", "metro", "subway", "taxi", "uber", "flight", "ferry",
                "tram", "airport", "transfer", "shuttle", "rental", "scooter", "bike")) {
            return "transport";
        }
        return "activities";
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
