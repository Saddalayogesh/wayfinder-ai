package com.tripplanner.favorite;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * A place a user has saved for later. One entry per (user, place) pair —
 * favoriting the same place twice is idempotent.
 */
@Entity
@Table(name = "favorites",
        uniqueConstraints = @UniqueConstraint(name = "uk_favorites_user_place", columnNames = {"user_id", "place_id"}))
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "place_id", nullable = false, length = 255)
    private String placeId;

    @Column(name = "place_name", nullable = false, length = 200)
    private String placeName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Favorite() {
        // Required by JPA.
    }

    public Favorite(Long userId, String placeId, String placeName) {
        this.userId = userId;
        this.placeId = placeId;
        this.placeName = placeName;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getPlaceId() {
        return placeId;
    }

    public String getPlaceName() {
        return placeName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
