package com.cinema.catalog_service.dto;

import com.cinema.catalog_service.entity.Seat;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record MovieRequest(
            @NotBlank @Size(max = 180) String title,
            @Size(max = 5000) String description,
            @NotBlank @Size(max = 80) String genre,
            @Min(1) int durationMinutes,
            @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal rating,
            @Size(max = 500) String posterUrl
    ) {
    }

    public record MovieResponse(
            Long id, String title, String description, String genre, int durationMinutes,
            BigDecimal rating, String posterUrl, boolean active
    ) {
    }

    public record TheaterRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 100) String city,
            @NotBlank @Size(max = 300) String address
    ) {
    }

    public record TheaterResponse(Long id, String name, String city, String address) {
    }

    public record ScreenRequest(
            @NotNull Long theaterId,
            @NotBlank @Size(max = 100) String name,
            @Min(1) int rows,
            @Min(1) int columns
    ) {
    }

    public record ScreenResponse(Long id, Long theaterId, String theaterName, String name, int rows, int columns) {
    }

    public record SeatRequest(
            @NotNull Long screenId,
            @NotBlank @Size(max = 5) String rowLabel,
            @Min(1) int seatNumber,
            @NotNull Seat.Category category
    ) {
    }

    public record SeatResponse(Long id, Long screenId, String rowLabel, int seatNumber, Seat.Category category) {
    }

    public record ShowtimeRequest(
            @NotNull Long movieId,
            @NotNull Long screenId,
            @NotNull @Future Instant startsAt,
            @NotNull @DecimalMin(value = "0.01") BigDecimal basePrice
    ) {
    }

    public record ShowtimeResponse(
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
}
