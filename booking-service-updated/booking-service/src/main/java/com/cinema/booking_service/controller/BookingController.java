package com.cinema.booking_service.controller;

import com.cinema.booking_service.dto.BookingDtos.BookingResponse;
import com.cinema.booking_service.dto.BookingDtos.ConfirmBookingRequest;
import com.cinema.booking_service.dto.BookingDtos.LockSeatsRequest;
import com.cinema.booking_service.dto.BookingDtos.SeatAvailability;
import com.cinema.booking_service.dto.BookingDtos.SeatLockResponse;
import com.cinema.booking_service.dto.BookingDtos.TicketResponse;
import com.cinema.booking_service.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/api/seats/showtimes/{showtimeId}")
    public List<SeatAvailability> seatAvailability(@PathVariable Long showtimeId) {
        return bookingService.seatAvailability(showtimeId);
    }

    @PostMapping("/api/bookings/locks")
    public SeatLockResponse lockSeats(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody LockSeatsRequest request
    ) {
        return bookingService.lockSeats(userId(jwt), request);
    }

    @PostMapping("/api/bookings/confirm")
    public BookingResponse confirmBooking(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConfirmBookingRequest request
    ) {
        return bookingService.confirmBooking(userId(jwt), request);
    }

    @GetMapping("/api/bookings/my")
    public List<BookingResponse> myBookings(@AuthenticationPrincipal Jwt jwt) {
        return bookingService.myBookings(userId(jwt));
    }

    @PostMapping("/api/bookings/{bookingId}/cancel")
    public BookingResponse cancelBooking(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long bookingId
    ) {
        return bookingService.cancelBooking(userId(jwt), bookingId);
    }

    @GetMapping("/api/bookings/{bookingId}/ticket")
    public TicketResponse getTicket(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long bookingId
    ) {
        return bookingService.getTicket(userId(jwt), bookingId);
    }

    private Long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
