package com.cinema.catalog_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "showtimes", uniqueConstraints =
        @UniqueConstraint(name = "uk_screen_showtime_start", columnNames = {"screen_id", "starts_at"}))
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "base_price", nullable = false, precision = 8, scale = 2)
    private BigDecimal basePrice;

    @Column(nullable = false)
    private boolean active = true;

    protected Showtime() {
    }

    public Showtime(Movie movie, Screen screen, Instant startsAt, BigDecimal basePrice) {
        update(movie, screen, startsAt, basePrice);
    }

    public void update(Movie movie, Screen screen, Instant startsAt, BigDecimal basePrice) {
        this.movie = movie;
        this.screen = screen;
        this.startsAt = startsAt;
        this.endsAt = startsAt.plusSeconds(movie.getDurationMinutes() * 60L);
        this.basePrice = basePrice;
        this.active = true;
    }

    public void deactivate() { this.active = false; }

    public Long getId() { return id; }
    public Movie getMovie() { return movie; }
    public Screen getScreen() { return screen; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public BigDecimal getBasePrice() { return basePrice; }
    public boolean isActive() { return active; }
}
