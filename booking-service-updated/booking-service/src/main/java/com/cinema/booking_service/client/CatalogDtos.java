package com.cinema.booking_service.client;

import java.math.BigDecimal;
import java.time.Instant;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record Showtime(
            Long id,
            Long movieId,
            String movieTitle,
            Long screenId,
            String screenName,
            Long theaterId,
            String theaterName,
            String city,
            Instant startsAt,
            Instant endsAt,
            BigDecimal basePrice,
            boolean active
    ) {
    }

    public record Seat(Long id, Long screenId, String rowLabel, int seatNumber, String category) {
    }
}
