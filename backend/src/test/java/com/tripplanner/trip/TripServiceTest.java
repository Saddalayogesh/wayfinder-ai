package com.tripplanner.trip;

import com.tripplanner.exception.TripNotFoundException;
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
    void getAllForUser_queriesOnlyThatUser() {
        when(tripRepository.findAllByUserIdOrderByCreatedAtDesc(USER_A)).thenReturn(List.of());

        tripService.getAllForUser(USER_A);

        verify(tripRepository).findAllByUserIdOrderByCreatedAtDesc(USER_A);
        verify(tripRepository, never()).findAll();
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
