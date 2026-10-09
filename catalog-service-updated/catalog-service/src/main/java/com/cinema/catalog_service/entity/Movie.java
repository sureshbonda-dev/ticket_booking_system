package com.cinema.catalog_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 80)
    private String genre;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(nullable = false)
    private boolean active = true;

    protected Movie() {
    }

    public Movie(String title, String description, String genre, int durationMinutes,
                 BigDecimal rating, String posterUrl) {
        update(title, description, genre, durationMinutes, rating, posterUrl);
    }

    public void update(String title, String description, String genre, int durationMinutes,
                       BigDecimal rating, String posterUrl) {
        this.title = title.trim();
        this.description = description;
        this.genre = genre.trim();
        this.durationMinutes = durationMinutes;
        this.rating = rating;
        this.posterUrl = posterUrl;
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getGenre() { return genre; }
    public int getDurationMinutes() { return durationMinutes; }
    public BigDecimal getRating() { return rating; }
    public String getPosterUrl() { return posterUrl; }
    public boolean isActive() { return active; }
}
