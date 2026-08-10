package com.tripplanner.trip;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A single day within a {@link Trip}. Owns its {@link ItineraryItem}s
 * (cascade ALL + orphan removal), so deleting a day removes its items.
 */
@Entity
@Table(name = "trip_days")
public class TripDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(nullable = false)
    private LocalDate date;

    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    @BatchSize(size = 30)
    private List<ItineraryItem> items = new ArrayList<>();

    protected TripDay() {
        // Required by JPA.
    }

    public TripDay(Integer dayNumber, LocalDate date) {
        this.dayNumber = dayNumber;
        this.date = date;
    }

    public void addItem(ItineraryItem item) {
        item.setTripDay(this);
        this.items.add(item);
    }

    public Long getId() {
        return id;
    }

    public Trip getTrip() {
        return trip;
    }

    void setTrip(Trip trip) {
        this.trip = trip;
    }

    public Integer getDayNumber() {
        return dayNumber;
    }

    public void setDayNumber(Integer dayNumber) {
        this.dayNumber = dayNumber;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public List<ItineraryItem> getItems() {
        return items;
    }
}
