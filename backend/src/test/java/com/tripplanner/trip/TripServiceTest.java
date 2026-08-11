package com.tripplanner.trip;

import com.tripplanner.ai.dto.GeneratedActivity;
import com.tripplanner.ai.dto.GeneratedDay;
import com.tripplanner.ai.dto.GeneratedItinerary;
import com.tripplanner.exception.TripNotFoundException;
import com.tripplanner.places.GeoPoint;
import com.tripplanner.places.PlacesService;
import com.tripplanner.trip.dto.CostBreakdown;
import com.tripplanner.trip.dto.TripDayResponse;
import com.tripplanner.trip.dto.GenerateTripRequest;
import com.tripplanner.trip.dto.TripRequest;
import com.tripplanner.trip.dto.TripResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Proof that user A can never access, modify, or delete user B's trip:
 * every id-based service call raises {@link AccessDeniedException} (403)
 * when the trip's userId does not match the caller.
 */
@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    private static final Long USER_A = 1L;
    private static final Long USER_B = 2L;
    private static final Long TRIP_ID = 10L;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private PlacesService placesService;

    @InjectMocks
    private TripService tripService;

    // --- User A cannot READ user B's trip -----------------------------------

    @Test
    void getTripForUser_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.getTripForUser(USER_B, TRIP_ID));
    }

    // --- User A cannot MODIFY user B's trip ----------------------------------

    @Test
    void updateTrip_otherUsersTrip_throwsAccessDenied_andNeverSaves() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.updateTrip(USER_B, TRIP_ID, validRequest()));

        verify(tripRepository, never()).save(any());
    }

    @Test
    void addDay_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.addDay(USER_B, TRIP_ID,
                        new com.tripplanner.trip.dto.TripDayRequest(null, LocalDate.of(2026, 8, 2), null)));
    }

    @Test
    void addItem_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.addItem(USER_B, TRIP_ID, 99L,
                        new com.tripplanner.trip.dto.ItineraryItemRequest("Place", null, null, null, null, null, null)));
    }

    // --- User A cannot DELETE user B's trip ----------------------------------

    @Test
    void deleteTrip_otherUsersTrip_throwsAccessDenied_andNeverDeletes() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.deleteTrip(USER_B, TRIP_ID));

        verify(tripRepository, never()).delete(any());
    }

    @Test
    void deleteDay_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.deleteDay(USER_B, TRIP_ID, 99L));
    }

    @Test
    void deleteItem_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.deleteItem(USER_B, TRIP_ID, 99L, 99L));
    }

    // --- Ownership boundaries on the same user --------------------------------

    @Test
    void ownerCanReadOwnTrip() {
        Trip trip = tripOfUser(USER_A, TRIP_ID);
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(trip));

        TripResponse response = tripService.getTripForUser(USER_A, TRIP_ID);

        assertEquals(TRIP_ID, response.id());
        assertEquals("Destination", response.destination());
    }

    @Test
    void getTripForUser_missingTrip_throwsNotFound() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.empty());

        assertThrows(TripNotFoundException.class,
                () -> tripService.getTripForUser(USER_A, TRIP_ID));
    }

    @Test
    void persistGeneratedItinerary_geocodesItemsMissingCoordinates() {
        when(placesService.geocode("Mystery Spot, Somewhere"))
                .thenReturn(Optional.of(new GeoPoint(new BigDecimal("12.345"), new BigDecimal("67.890"))));
        when(tripRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GenerateTripRequest request = new GenerateTripRequest("Somewhere",
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 1),
                2, new BigDecimal("500"), "RELAXED", List.of());
        GeneratedItinerary itinerary = new GeneratedItinerary("Somewhere", List.of(
                new GeneratedDay(1, List.of(new GeneratedActivity(
                        "Mystery Spot", 60, new BigDecimal("5"), null, null)))));

        TripResponse response = tripService.persistGeneratedItinerary(USER_A, request, itinerary);

        assertEquals(0, new BigDecimal("12.345")
                .compareTo(response.days().get(0).items().get(0).latitude()));
        assertEquals(0, new BigDecimal("67.890")
                .compareTo(response.days().get(0).items().get(0).longitude()));
        // Geocoding is destination-hinted ("<name>, <destination>") so generic
        // names resolve in the right city.
        verify(placesService).geocode("Mystery Spot, Somewhere");
    }

    @Test
    void persistGeneratedItinerary_keepsGeminiCoordinates() {
        when(tripRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GenerateTripRequest request = new GenerateTripRequest("Somewhere",
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 1),
                2, new BigDecimal("500"), "RELAXED", List.of());
        GeneratedItinerary itinerary = new GeneratedItinerary("Somewhere", List.of(
                new GeneratedDay(1, List.of(new GeneratedActivity(
                        "Known Place", 60, new BigDecimal("5"),
                        new BigDecimal("1.11"), new BigDecimal("2.22"))))));

        TripResponse response = tripService.persistGeneratedItinerary(USER_A, request, itinerary);

        assertEquals(0, new BigDecimal("1.11")
                .compareTo(response.days().get(0).items().get(0).latitude()));
        verify(placesService, never()).geocode(any());
    }

    @Test
    void getAllForUser_queriesOnlyThatUser() {
        when(tripRepository.findAllByUserIdOrderByCreatedAtDesc(USER_A)).thenReturn(List.of());

        tripService.getAllForUser(USER_A);

        verify(tripRepository).findAllByUserIdOrderByCreatedAtDesc(USER_A);
        verify(tripRepository, never()).findAll();
    }

    // --- Currency ------------------------------------------------------------------

    @Test
    void persistGeneratedItinerary_usesRequestCurrency_orDefaultsToUsd() {
        when(tripRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GenerateTripRequest eur = new GenerateTripRequest("Somewhere",
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 1),
                2, new BigDecimal("500"), "RELAXED", List.of(), "eur");
        GeneratedItinerary itinerary = new GeneratedItinerary("Somewhere", List.of(
                new GeneratedDay(1, List.of(new GeneratedActivity(
                        "Place", 60, new BigDecimal("5"), null, null)))));

        TripResponse fromRequest = tripService.persistGeneratedItinerary(USER_A, eur, itinerary);
        assertEquals("EUR", fromRequest.currency());

        GenerateTripRequest noCurrency = new GenerateTripRequest("Somewhere",
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 1),
                2, new BigDecimal("500"), "RELAXED", List.of());
        TripResponse defaulted = tripService.persistGeneratedItinerary(USER_A, noCurrency, itinerary);
        assertEquals("USD", defaulted.currency());
    }

    @Test
    void createTrip_setsCurrencyFromRequest() {
        when(tripRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TripRequest inr = new TripRequest("Title", "Destination",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5),
                2, new BigDecimal("1000"), "RELAXED", List.of(), null, "INR");

        TripResponse response = tripService.createTrip(USER_A, inr);

        assertEquals("INR", response.currency());
    }

    // --- Day regeneration -------------------------------------------------------

    /**
     * The core guarantee: regenerating day 2 replaces ONLY day 2's items —
     * day 1 and day 3 are byte-for-byte identical after the operation.
     */
    @Test
    void replaceDayItems_replacesOnlyTargetDay_otherDaysByteForByteUnchanged() {
        Trip trip = tripOfUser(USER_A, TRIP_ID);
        TripDay day1 = new TripDay(1, LocalDate.of(2026, 8, 1));
        day1.addItem(new ItineraryItem("Day1 Morning", "desc1", new BigDecimal("1.1"), new BigDecimal("2.2"),
                new BigDecimal("10"), 60, 1));
        day1.addItem(new ItineraryItem("Day1 Evening", null, null, null, new BigDecimal("5"), 45, 2));
        TripDay day2 = new TripDay(2, LocalDate.of(2026, 8, 2));
        day2.addItem(new ItineraryItem("Day2 Old Plan", null, new BigDecimal("3.3"), new BigDecimal("4.4"),
                new BigDecimal("20"), 90, 1));
        TripDay day3 = new TripDay(3, LocalDate.of(2026, 8, 3));
        day3.addItem(new ItineraryItem("Day3 Only", "stable", new BigDecimal("5.5"), new BigDecimal("6.6"),
                new BigDecimal("15"), 30, 1));
        trip.addDay(day1);
        trip.addDay(day2);
        trip.addDay(day3);
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(trip));

        TripResponse before = TripResponse.from(trip); // snapshot days 1 and 3

        List<GeneratedActivity> newPlan = List.of(
                new GeneratedActivity("Day2 New Place", 120, new BigDecimal("30"),
                        new BigDecimal("7.7"), new BigDecimal("8.8")),
                new GeneratedActivity("Day2 New Food", 60, new BigDecimal("12"), null, null));
        TripResponse after = tripService.replaceDayItems(USER_A, TRIP_ID, 2, newPlan);

        // Day 2 was replaced with the new plan...
        assertEquals(2, after.days().get(1).items().size());
        assertEquals("Day2 New Place", after.days().get(1).items().get(0).placeName());
        assertEquals("Day2 New Food", after.days().get(1).items().get(1).placeName());

        // ...and days 1 and 3 are byte-for-byte identical (record equality covers
        // every field: ids, dayNumber, date, and all item fields).
        assertEquals(before.days().get(0), after.days().get(0));
        assertEquals(before.days().get(2), after.days().get(2));
    }

    @Test
    void replaceDayItems_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.replaceDayItems(USER_B, TRIP_ID, 1, List.of()));
    }

    @Test
    void getRegenerateContext_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.getRegenerateContext(USER_B, TRIP_ID, 1));
    }

    @Test
    void getRegenerateContext_unknownDay_throwsNotFound() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A, TRIP_ID)));

        assertThrows(TripNotFoundException.class,
                () -> tripService.getRegenerateContext(USER_A, TRIP_ID, 7));
    }

    @Test
    void getRegenerateContext_flagsOnlyTheTargetDay() {
        Trip trip = tripOfUser(USER_A, TRIP_ID);
        TripDay day1 = new TripDay(1, LocalDate.of(2026, 8, 1));
        day1.addItem(new ItineraryItem("Museum", null, null, null, null, 60, 1));
        TripDay day2 = new TripDay(2, LocalDate.of(2026, 8, 2));
        trip.addDay(day1);
        trip.addDay(day2);
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(trip));

        RegenerateContext context = tripService.getRegenerateContext(USER_A, TRIP_ID, 2);

        assertThat(context.itinerarySummary()).contains("Day 1: Museum");
        assertThat(context.itinerarySummary()).contains("Day 2: (no plan yet) [THIS IS THE DAY BEING REGENERATED]");
        assertThat(context.destination()).isEqualTo("Destination");
    }

    // --- Cost breakdown ----------------------------------------------------------

    @Test
    void costBreakdownSumsAllItemsAndComputesRemaining() {
        Trip trip = tripOfUser(USER_A, TRIP_ID); // budget 1000
        TripDay day1 = new TripDay(1, LocalDate.of(2026, 8, 1));
        day1.addItem(new ItineraryItem("Hotel Stay", null, null, null, new BigDecimal("300"), 480, 1));
        day1.addItem(new ItineraryItem("Sushi Dinner", null, null, null, new BigDecimal("80"), 90, 2));
        TripDay day2 = new TripDay(2, LocalDate.of(2026, 8, 2));
        day2.addItem(new ItineraryItem("Taxi", null, null, null, new BigDecimal("20"), 30, 1));
        trip.addDay(day1);
        trip.addDay(day2);

        CostBreakdown cost = CostBreakdown.from(trip);

        assertEquals(0, new BigDecimal("400").compareTo(cost.estimatedTotal()));
        assertEquals(0, new BigDecimal("600").compareTo(cost.remaining()));
        assertEquals(0, new BigDecimal("300").compareTo(cost.breakdown().get("accommodation")));
        assertEquals(0, new BigDecimal("80").compareTo(cost.breakdown().get("food")));
        assertEquals(0, new BigDecimal("20").compareTo(cost.breakdown().get("transport")));
        assertEquals(0, new BigDecimal("0").compareTo(cost.breakdown().get("activities")));
    }

    @Test
    void costBreakdown_defaultsUnmatchedItemsToActivities() {
        Trip trip = tripOfUser(USER_A, TRIP_ID);
        TripDay day = new TripDay(1, LocalDate.of(2026, 8, 1));
        day.addItem(new ItineraryItem("Kinkaku-ji Temple", null, null, null, new BigDecimal("10"), 90, 1));
        day.addItem(new ItineraryItem("Walking tour", null, null, null, new BigDecimal("25"), 120, 2));
        trip.addDay(day);

        CostBreakdown cost = CostBreakdown.from(trip);

        assertEquals(0, new BigDecimal("35").compareTo(cost.breakdown().get("activities")));
        assertEquals(0, new BigDecimal("35").compareTo(cost.estimatedTotal()));
    }

    @Test
    void costBreakdown_ignoresItemsWithoutCost() {
        Trip trip = tripOfUser(USER_A, TRIP_ID);
        TripDay day = new TripDay(1, LocalDate.of(2026, 8, 1));
        day.addItem(new ItineraryItem("Free Walk", null, null, null, null, 60, 1));
        day.addItem(new ItineraryItem("Also Free", null, null, null, null, 60, 2));
        trip.addDay(day);

        CostBreakdown cost = CostBreakdown.from(trip);

        assertEquals(0, new BigDecimal("0").compareTo(cost.estimatedTotal()));
        assertEquals(0, new BigDecimal("1000").compareTo(cost.remaining()));
    }

    // --- Helpers ---------------------------------------------------------------

    private Trip tripOfUser(Long userId, Long tripId) {
        Trip trip = new Trip(userId, "Title", "Destination",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5),
                2, new BigDecimal("1000"), "RELAXED");
        setId(trip, tripId);
        return trip;
    }

    private TripRequest validRequest() {
        return new TripRequest("Title", "Destination",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5),
                2, new BigDecimal("1000"), "RELAXED", List.of("Food"), null);
    }

    private void setId(Trip trip, Long id) {
        try {
            Field field = Trip.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(trip, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
