package com.cinema.booking_service.dto;

import com.cinema.booking_service.entity.Booking;
import com.cinema.booking_service.entity.SeatInventory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class BookingDtos {

    private BookingDtos() {
    }

    public enum MockPaymentOutcome { SUCCESS, FAILURE }

    public record LockSeatsRequest(
            @NotNull @Positive Long showtimeId,
            @NotEmpty @Size(max = 10) List<@NotNull @Positive Long> seatIds
    ) {
    }

    public record SeatLockResponse(
            String lockId, Long showtimeId, Instant expiresAt, List<Long> seatIds
    ) {
    }

    public record ConfirmBookingRequest(
            @NotBlank String lockId,
            MockPaymentOutcome paymentOutcome
    ) {
    }

    public record BookingResponse(
            Long id,
            String bookingReference,
            Long userId,
            Long showtimeId,
            Instant showtimeStartsAt,
            List<Long> seatIds,
            BigDecimal amount,
            Booking.Status status,
            Instant createdAt,
            String ticketCode
    ) {
        public static BookingResponse from(Booking booking) {
            return new BookingResponse(
                    booking.getId(), booking.getBookingReference(), booking.getUserId(), booking.getShowtimeId(),
                    booking.getShowtimeStartsAt(), booking.getSeatIds(), booking.getAmount(), booking.getStatus(),
                    booking.getCreatedAt(), booking.getTicketCode()
            );
        }
    }

    public record SeatAvailability(
            Long seatId, String rowLabel, int seatNumber, String category, SeatInventory.Status status
    ) {
    }

    public record TicketResponse(
            String bookingReference,
            String ticketCode,
            Long showtimeId,
            Instant showtimeStartsAt,
            List<Long> seatIds,
            BigDecimal amount
    ) {
    }

    public record TicketVerificationResponse(
            boolean valid,
            String bookingReference,
            Long showtimeId,
            Instant showtimeStartsAt,
            List<Long> seatIds
    ) {
    }
}
