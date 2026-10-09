package com.cinema.booking_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "seat_inventory", uniqueConstraints =
        @UniqueConstraint(name = "uk_showtime_seat", columnNames = {"showtime_id", "seat_id"}))
public class SeatInventory {

    public enum Status { AVAILABLE, LOCKED, RESERVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "showtime_id", nullable = false)
    private Long showtimeId;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.AVAILABLE;

    @Column(name = "lock_id", length = 36)
    private String lockId;

    @Column(name = "locked_by_user_id")
    private Long lockedByUserId;

    @Column(name = "lock_expires_at")
    private Instant lockExpiresAt;

    @Column(name = "booking_id")
    private Long bookingId;

    protected SeatInventory() {
    }

    public SeatInventory(Long showtimeId, Long seatId) {
        this.showtimeId = showtimeId;
        this.seatId = seatId;
    }

    public void lock(String lockId, Long userId, Instant expiresAt) {
        this.status = Status.LOCKED;
        this.lockId = lockId;
        this.lockedByUserId = userId;
        this.lockExpiresAt = expiresAt;
        this.bookingId = null;
    }

    public void release() {
        this.status = Status.AVAILABLE;
        this.lockId = null;
        this.lockedByUserId = null;
        this.lockExpiresAt = null;
        this.bookingId = null;
    }

    public void reserve(Long bookingId) {
        this.status = Status.RESERVED;
        this.bookingId = bookingId;
        this.lockId = null;
        this.lockedByUserId = null;
        this.lockExpiresAt = null;
    }

    public Long getId() { return id; }
    public Long getShowtimeId() { return showtimeId; }
    public Long getSeatId() { return seatId; }
    public Status getStatus() { return status; }
    public String getLockId() { return lockId; }
    public Long getLockedByUserId() { return lockedByUserId; }
    public Instant getLockExpiresAt() { return lockExpiresAt; }
    public Long getBookingId() { return bookingId; }
}
