package com.tripplanner.trip;

import com.tripplanner.exception.TripNotFoundException;
import com.tripplanner.places.PlacesService;
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
import java.util.Optional;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Trip sharing: only the owner can create a share token (403 otherwise), the
 * token is random and non-guessable, is stable across calls, and the public
 * token lookup returns a read-only view or a 404.
 */
@ExtendWith(MockitoExtension.class)
class TripSharingTest {

    private static final Long USER_A = 1L;
    private static final Long USER_B = 2L;
    private static final Long TRIP_ID = 10L;

    private static final Pattern HEX_48 = Pattern.compile("^[0-9a-f]{48}$");

    @Mock
    private TripRepository tripRepository;

    @Mock
    private PlacesService placesService;

    @InjectMocks
    private TripService tripService;

    @Test
    void createShareToken_generatesNonGuessableTokenAndPersistsIt() {
        Trip trip = tripOfUser(USER_A);
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(trip));

        String token = tripService.createShareToken(USER_A, TRIP_ID);

        assertThat(token).matches(HEX_48.pattern());
        assertThat(trip.getShareToken()).isEqualTo(token);
        verify(tripRepository).save(trip);
    }

    @Test
    void createShareToken_secondCallReturnsTheSameToken() {
        Trip trip = tripOfUser(USER_A);
        trip.setShareToken("existingtoken123");
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(trip));

        String token = tripService.createShareToken(USER_A, TRIP_ID);

        assertThat(token).isEqualTo("existingtoken123");
        verify(tripRepository, never()).save(trip);
    }

    @Test
    void createShareToken_otherUsersTrip_throwsAccessDenied() {
        when(tripRepository.findById(TRIP_ID)).thenReturn(Optional.of(tripOfUser(USER_A)));

        assertThrows(AccessDeniedException.class,
                () -> tripService.createShareToken(USER_B, TRIP_ID));
    }

    @Test
    void getSharedTrip_returnsReadOnlyViewForAnyoneWithTheToken() {
        Trip trip = tripOfUser(USER_A);
        trip.setShareToken("tok");
        when(tripRepository.findByShareToken("tok")).thenReturn(Optional.of(trip));

        TripResponse shared = tripService.getSharedTrip("tok");

        assertThat(shared.id()).isEqualTo(TRIP_ID);
        assertThat(shared.destination()).isEqualTo("Destination");
    }

    @Test
    void getSharedTrip_unknownToken_throwsNotFound() {
        when(tripRepository.findByShareToken("nope")).thenReturn(Optional.empty());

        assertThrows(TripNotFoundException.class,
                () -> tripService.getSharedTrip("nope"));
    }

    private Trip tripOfUser(Long userId) {
        Trip trip = new Trip(userId, "Title", "Destination",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5),
                2, new BigDecimal("1000"), "RELAXED");
        setId(trip, TRIP_ID);
        return trip;
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
