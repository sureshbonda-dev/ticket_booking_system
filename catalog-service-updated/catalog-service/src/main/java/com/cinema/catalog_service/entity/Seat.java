package com.cinema.catalog_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.util.Locale;

@Entity
@Table(name = "seats", uniqueConstraints =
        @UniqueConstraint(name = "uk_seat_position", columnNames = {"screen_id", "row_label", "seat_number"}))
public class Seat {

    public enum Category { REGULAR, VIP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;

    @Column(name = "row_label", nullable = false, length = 5)
    private String rowLabel;

    @Column(name = "seat_number", nullable = false)
    private int seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    protected Seat() {
    }

    public Seat(Screen screen, String rowLabel, int seatNumber, Category category) {
        this.screen = screen;
        this.rowLabel = rowLabel.trim().toUpperCase(Locale.ROOT);
        this.seatNumber = seatNumber;
        this.category = category;
    }

    public Long getId() { return id; }
    public Screen getScreen() { return screen; }
    public String getRowLabel() { return rowLabel; }
    public int getSeatNumber() { return seatNumber; }
    public Category getCategory() { return category; }
}
