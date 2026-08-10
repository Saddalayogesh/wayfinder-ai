package com.tripplanner.trip;

import com.tripplanner.ai.dto.GeneratedActivity;
import com.tripplanner.ai.dto.GeneratedDay;
import com.tripplanner.ai.dto.GeneratedItinerary;
import com.tripplanner.exception.TripNotFoundException;
import com.tripplanner.trip.dto.GenerateTripRequest;
import com.tripplanner.trip.dto.ItineraryItemRequest;
import com.tripplanner.trip.dto.TripDayRequest;
import com.tripplanner.trip.dto.TripRequest;
import com.tripplanner.trip.dto.TripResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Business logic for trips.
 *
 * <p><b>Ownership rule (critical):</b> every operation that targets a trip by
 * id loads it, then verifies {@code trip.userId == callerId}. A trip belonging
 * to another user raises {@link AccessDeniedException} (403); a non-existent
 * trip raises {@link TripNotFoundException} (404).</p>
 */
@Service
public class TripService {

    private final TripRepository tripRepository;

    public TripService(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    @Transactional
    public TripResponse createTrip(Long userId, TripRequest request) {
        Trip trip = new Trip(userId, request.title().trim(), request.destination().trim(),
                request.startDate(), request.endDate(), request.travelers(), request.budget(),
                request.travelStyle().trim());
        trip.setInterests(sanitizeInterests(request.interests()));
        replaceDays(trip, request.days());
        return TripResponse.from(tripRepository.save(trip));
    }

    @Transactional
    public TripResponse updateTrip(Long userId, Long tripId, TripRequest request) {
        Trip trip = getOwnedTrip(tripId, userId);
        trip.setTitle(request.title().trim());
        trip.setDestination(request.destination().trim());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setTravelers(request.travelers());
        trip.setBudget(request.budget());
        trip.setTravelStyle(request.travelStyle().trim());
        trip.setInterests(sanitizeInterests(request.interests()));
        // days == null keeps existing days; [] removes them; a list replaces them
        if (request.days() != null) {
            replaceDays(trip, request.days());
        }
        return TripResponse.from(trip);
    }

    @Transactional
    public void deleteTrip(Long userId, Long tripId) {
        // Cascade (Trip -> TripDay -> ItineraryItem) removes the whole itinerary.
        Trip trip = getOwnedTrip(tripId, userId);
        tripRepository.delete(trip);
    }

    @Transactional(readOnly = true)
    public TripResponse getTripForUser(Long userId, Long tripId) {
        return TripResponse.from(getOwnedTrip(tripId, userId));
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getAllForUser(Long userId) {
        return tripRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(TripResponse::from)
                .toList();
    }

    /** Maximum number of itinerary days generated from a date range. */
    private static final int MAX_GENERATED_DAYS = 31;

    /**
     * Persists a trip from a Gemini-generated itinerary. Days are created for
     * every date in the requested range; activities are attached to the day
     * matching their day number (activities for out-of-range days are dropped).
     */
    @Transactional
    public TripResponse persistGeneratedItinerary(Long userId, GenerateTripRequest request,
                                                  GeneratedItinerary itinerary) {
        long requestedDays = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
        int dayCount = (int) Math.min(requestedDays, MAX_GENERATED_DAYS);

        Trip trip = new Trip(userId, "AI itinerary for " + request.destination().trim(),
                request.destination().trim(), request.startDate(), request.endDate(),
                request.travelers(), request.budget(), request.travelStyle().trim());
        trip.setInterests(sanitizeInterests(request.interests()));

        Map<Integer, List<GeneratedActivity>> activitiesByDay = itinerary.days().stream()
                .filter(day -> day.day() != null)
                .collect(Collectors.toMap(GeneratedDay::day, GeneratedDay::activities,
                        (first, second) -> first, LinkedHashMap::new));

        for (int dayNumber = 1; dayNumber <= dayCount; dayNumber++) {
            LocalDate date = request.startDate().plusDays(dayNumber - 1L);
            TripDay day = new TripDay(dayNumber, date);
            int order = 1;
            for (GeneratedActivity activity : activitiesByDay.getOrDefault(dayNumber, List.of())) {
                if (activity.name() == null || activity.name().isBlank()) {
                    continue;
                }
                day.addItem(new ItineraryItem(activity.name().trim(), null,
                        activity.latitude(), activity.longitude(),
                        activity.estimatedCost(), activity.duration(), order++));
            }
            trip.addDay(day);
        }
        return TripResponse.from(tripRepository.save(trip));
    }

    // --- Day / item management ----------------------------------------------

    @Transactional
    public TripResponse addDay(Long userId, Long tripId, TripDayRequest request) {
        Trip trip = getOwnedTrip(tripId, userId);
        int nextDayNumber = trip.getDays().stream()
                .mapToInt(TripDay::getDayNumber).max().orElse(0) + 1;
        TripDay day = new TripDay(
                request.dayNumber() != null ? request.dayNumber() : nextDayNumber,
                request.date());
        if (request.items() != null) {
            int i = 1;
            for (ItineraryItemRequest itemRequest : request.items()) {
                day.addItem(toItem(itemRequest,
                        itemRequest.sequenceOrder() != null ? itemRequest.sequenceOrder() : i++));
            }
        }
        trip.addDay(day);
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse addItem(Long userId, Long tripId, Long dayId, ItineraryItemRequest request) {
        Trip trip = getOwnedTrip(tripId, userId);
        TripDay day = findDay(trip, dayId);
        int nextOrder = day.getItems().stream()
                .mapToInt(ItineraryItem::getSequenceOrder).max().orElse(0) + 1;
        day.addItem(toItem(request, request.sequenceOrder() != null ? request.sequenceOrder() : nextOrder));
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse deleteDay(Long userId, Long tripId, Long dayId) {
        Trip trip = getOwnedTrip(tripId, userId);
        TripDay day = findDay(trip, dayId);
        trip.getDays().remove(day); // orphan removal cascades to the day's items
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse deleteItem(Long userId, Long tripId, Long dayId, Long itemId) {
        Trip trip = getOwnedTrip(tripId, userId);
        TripDay day = findDay(trip, dayId);
        ItineraryItem item = day.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new TripNotFoundException("Itinerary item not found"));
        day.getItems().remove(item);
        return TripResponse.from(trip);
    }

    // --- Helpers -------------------------------------------------------------

    private Trip getOwnedTrip(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));
        if (!trip.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this trip");
        }
        return trip;
    }

    private TripDay findDay(Trip trip, Long dayId) {
        return trip.getDays().stream()
                .filter(day -> day.getId().equals(dayId))
                .findFirst()
                .orElseThrow(() -> new TripNotFoundException("Trip day not found"));
    }

    private void replaceDays(Trip trip, List<TripDayRequest> days) {
        trip.getDays().clear(); // orphanRemoval removes previous days and their items
        if (days == null) {
            return;
        }
        int dayIndex = 1;
        for (TripDayRequest dayRequest : days) {
            TripDay day = new TripDay(
                    dayRequest.dayNumber() != null ? dayRequest.dayNumber() : dayIndex,
                    dayRequest.date());
            if (dayRequest.items() != null) {
                int itemIndex = 1;
                for (ItineraryItemRequest itemRequest : dayRequest.items()) {
                    day.addItem(toItem(itemRequest,
                            itemRequest.sequenceOrder() != null ? itemRequest.sequenceOrder() : itemIndex++));
                }
            }
            trip.addDay(day);
            dayIndex++;
        }
    }

    private ItineraryItem toItem(ItineraryItemRequest request, Integer sequenceOrder) {
        return new ItineraryItem(request.placeName().trim(), request.description(),
                request.latitude(), request.longitude(), request.estimatedCost(),
                request.visitDuration(), sequenceOrder);
    }

    private Set<String> sanitizeInterests(List<String> interests) {
        if (interests == null) {
            return Set.of();
        }
        Set<String> cleaned = new HashSet<>();
        for (String interest : interests) {
            if (interest != null && !interest.isBlank()) {
                cleaned.add(interest.trim());
            }
        }
        return cleaned;
    }
}
