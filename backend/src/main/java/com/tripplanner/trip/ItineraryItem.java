package com.tripplanner.trip;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * A single planned place/activity inside a {@link TripDay}.
 */
@Entity
@Table(name = "itinerary_items")
public class ItineraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_day_id", nullable = false)
    private TripDay tripDay;

    @Column(name = "place_name", nullable = false, length = 200)
    private String placeName;

    @Column(length = 1000)
    private String description;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "estimated_cost", precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    /** Approximate visit time in minutes. */
    @Column(name = "visit_duration")
    private Integer visitDuration;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    protected ItineraryItem() {
        // Required by JPA.
    }

    public ItineraryItem(String placeName, String description, BigDecimal latitude, BigDecimal longitude,
                         BigDecimal estimatedCost, Integer visitDuration, Integer sequenceOrder) {
        this.placeName = placeName;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.estimatedCost = estimatedCost;
        this.visitDuration = visitDuration;
        this.sequenceOrder = sequenceOrder;
    }

    public Long getId() {
        return id;
    }

    public TripDay getTripDay() {
        return tripDay;
    }

    void setTripDay(TripDay tripDay) {
        this.tripDay = tripDay;
    }

    public String getPlaceName() {
        return placeName;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public Integer getVisitDuration() {
        return visitDuration;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }
}
