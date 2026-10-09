package com.cinema.booking_service.controller;

import com.cinema.booking_service.dto.BookingDtos.TicketResponse;
import com.cinema.booking_service.dto.BookingDtos.TicketVerificationResponse;
import com.cinema.booking_service.entity.Booking;
import com.cinema.booking_service.repository.BookingRepository;
import com.cinema.booking_service.service.BookingService;
import com.cinema.booking_service.service.TicketPdfService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
public class TicketController {

    private final BookingService bookingService;
    private final TicketPdfService ticketPdfService;
    private final BookingRepository bookingRepository;

    public TicketController(
            BookingService bookingService,
            TicketPdfService ticketPdfService,
            BookingRepository bookingRepository
    ) {
        this.bookingService = bookingService;
        this.ticketPdfService = ticketPdfService;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/api/bookings/{bookingId}/ticket.pdf")
    public ResponseEntity<ByteArrayResource> downloadTicket(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long bookingId
    ) {
        TicketResponse ticket = bookingService.getTicket(userId(jwt), bookingId);
        byte[] pdf = ticketPdfService.create(ticket);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(ticket.bookingReference() + ".pdf", StandardCharsets.UTF_8).build().toString())
                .body(new ByteArrayResource(pdf));
    }

    @GetMapping("/api/bookings/admin/tickets/{ticketCode}/verify")
    public TicketVerificationResponse verifyTicket(@PathVariable String ticketCode) {
        return bookingRepository.findByTicketCodeAndStatus(ticketCode, Booking.Status.CONFIRMED)
                .map(booking -> new TicketVerificationResponse(true, booking.getBookingReference(),
                        booking.getShowtimeId(), booking.getShowtimeStartsAt(), booking.getSeatIds()))
                .orElseGet(() -> new TicketVerificationResponse(false, null, null, null, List.of()));
    }

    private Long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
