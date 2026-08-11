package com.tripplanner.trip;

import com.tripplanner.trip.dto.CostBreakdown;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for the heuristic cost categorization and budget math. */
class CostBreakdownTest {

    private Trip tripWith(TripDay... days) {
        Trip trip = new Trip(1L, "Title", "Destination",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5),
                2, new BigDecimal("1000"), "RELAXED");
        for (TripDay day : days) {
            trip.addDay(day);
        }
        return trip;
    }

    private TripDay day(int number) {
        return new TripDay(number, LocalDate.of(2026, 8, number));
    }

    private void add(TripDay day, String name, String cost) {
        day.addItem(new ItineraryItem(name, null, null, null,
                cost == null ? null : new BigDecimal(cost), 60, day.getItems().size() + 1));
    }

    @Test
    void categorizesByKeywordHeuristic() {
        TripDay d = day(1);
        add(d, "Ryokan Stay", "250");            // accommodation
        add(d, "Nishiki Market food tour", "40"); // food
        add(d, "Airport shuttle", "30");          // transport
        add(d, "Kiyomizu-dera Temple", "10");     // activities (default)
        Trip trip = tripWith(d);

        CostBreakdown cost = CostBreakdown.from(trip);

        assertThat(cost.breakdown().get("accommodation")).isEqualByComparingTo("250");
        assertThat(cost.breakdown().get("food")).isEqualByComparingTo("40");
        assertThat(cost.breakdown().get("transport")).isEqualByComparingTo("30");
        assertThat(cost.breakdown().get("activities")).isEqualByComparingTo("10");
        assertThat(cost.estimatedTotal()).isEqualByComparingTo("330");
        assertThat(cost.remaining()).isEqualByComparingTo("670");
    }

    @Test
    void categorizationIgnoresCaseAndUsesDescription() {
        TripDay d = day(1);
        add(d, "HOTEL", "100");
        add(d, "Guided walk", "20"); // description mentions nothing; still activities
        TripDay d2 = day(2);
        add(d2, "Secret spot", "15");
        Trip trip = tripWith(d, d2);

        CostBreakdown cost = CostBreakdown.from(trip);

        assertThat(cost.breakdown().get("accommodation")).isEqualByComparingTo("100");
        assertThat(cost.breakdown().get("activities")).isEqualByComparingTo("35");
    }

    @Test
    void emptyItineraryYieldsZeros() {
        Trip trip = tripWith(day(1));

        CostBreakdown cost = CostBreakdown.from(trip);

        assertThat(cost.estimatedTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(cost.remaining()).isEqualByComparingTo("1000");
        assertThat(cost.breakdown()).containsOnlyKeys("accommodation", "food", "activities", "transport");
        assertThat(cost.breakdown().values()).allMatch(v -> v.compareTo(BigDecimal.ZERO) == 0);
    }
}
