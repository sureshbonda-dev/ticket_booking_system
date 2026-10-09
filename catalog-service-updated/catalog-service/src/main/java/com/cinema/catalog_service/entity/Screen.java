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

@Entity
@Table(name = "screens", uniqueConstraints =
        @UniqueConstraint(name = "uk_screen_theater_name", columnNames = {"theater_id", "name"}))
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "seat_rows", nullable = false)
    private int rows;

    @Column(name = "seat_columns", nullable = false)
    private int columns;

    protected Screen() {
    }

    public Screen(Theater theater, String name, int rows, int columns) {
        update(theater, name, rows, columns);
    }

    public void update(Theater theater, String name, int rows, int columns) {
        this.theater = theater;
        this.name = name.trim();
        this.rows = rows;
        this.columns = columns;
    }

    public Long getId() { return id; }
    public Theater getTheater() { return theater; }
    public String getName() { return name; }
    public int getRows() { return rows; }
    public int getColumns() { return columns; }
}
