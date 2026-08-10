package com.tripplanner.favorite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /** A user's favorites, newest first. */
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** For idempotent favoriting: the existing entry for a (user, place) pair. */
    Optional<Favorite> findByUserIdAndPlaceId(Long userId, String placeId);
}
