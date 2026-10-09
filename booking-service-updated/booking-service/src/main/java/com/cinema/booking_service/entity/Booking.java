package com.cinema.booking_service.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", uniqueConstraints =
        @UniqueConstraint(name = "uk_booking_reference", columnNames = "booking_reference"))
public class Booking {

    public enum Status { CONFIRMED, PAYMENT_FAILED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "showtime_id", nullable = false)
    private Long showtimeId;

    @Column(name = "showtime_starts_at", nullable = false)
    private Instant showtimeStartsAt;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 40)
    private String bookingReference;

    @Column(name = "ticket_code", length = 36)
    private String ticketCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Status status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "booking_seats", joinColumns = @JoinColumn(name = "booking_id"))
    @Column(name = "seat_id", nullable = false)
    @OrderColumn(name = "seat_order")
    private List<Long> seatIds = new ArrayList<>();

    protected Booking() {
    }

    public Booking(Long userId, Long showtimeId, Instant showtimeStartsAt, String bookingReference,
                   String ticketCode, BigDecimal amount, List<Long> seatIds) {
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.showtimeStartsAt = showtimeStartsAt;
        this.bookingReference = bookingReference;
        this.ticketCode = ticketCode;
        this.amount = amount;
        this.seatIds = new ArrayList<>(seatIds);
        this.status = Status.CONFIRMED;
    }

    @PrePersist
    protected void beforeInsert() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void markPaymentFailed() {
        this.status = Status.PAYMENT_FAILED;
        this.ticketCode = null;
    }

    public void cancel(Instant cancelledAt) {
        this.status = Status.CANCELLED;
        this.cancelledAt = cancelledAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getShowtimeId() { return showtimeId; }
    public Instant getShowtimeStartsAt() { return showtimeStartsAt; }
    public String getBookingReference() { return bookingReference; }
    public String getTicketCode() { return ticketCode; }
    public BigDecimal getAmount() { return amount; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public List<Long> getSeatIds() { return List.copyOf(seatIds); }
}
