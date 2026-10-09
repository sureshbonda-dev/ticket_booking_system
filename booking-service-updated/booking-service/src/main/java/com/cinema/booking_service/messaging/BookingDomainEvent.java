package com.cinema.booking_service.messaging;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BookingDomainEvent(
        String eventType,
        Long bookingId,
        String bookingReference,
        Long userId,
        Long showtimeId,
        List<Long> seatIds,
        BigDecimal amount,
        Instant occurredAt
) {
}
