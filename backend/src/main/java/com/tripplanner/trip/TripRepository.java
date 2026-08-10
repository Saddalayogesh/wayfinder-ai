package com.tripplanner.trip;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {

    /**
     * Nested collections are loaded in batches via {@code @BatchSize} on the
     * entities, avoiding both the N+1 problem and Hibernate's
     * MultipleBagFetchException (cannot JOIN FETCH two lists at once).
     */
    List<Trip> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Trip> findByIdAndUserId(Long id, Long userId);

    /** Read-only public access to a shared trip via its random share token. */
    Optional<Trip> findByShareToken(String shareToken);
}
