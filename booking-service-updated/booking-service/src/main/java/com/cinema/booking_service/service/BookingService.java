package com.cinema.booking_service.service;

import com.cinema.booking_service.client.CatalogClient;
import com.cinema.booking_service.client.CatalogDtos;
import com.cinema.booking_service.dto.BookingDtos.BookingResponse;
import com.cinema.booking_service.dto.BookingDtos.ConfirmBookingRequest;
import com.cinema.booking_service.dto.BookingDtos.LockSeatsRequest;
import com.cinema.booking_service.dto.BookingDtos.MockPaymentOutcome;
import com.cinema.booking_service.dto.BookingDtos.SeatAvailability;
import com.cinema.booking_service.dto.BookingDtos.SeatLockResponse;
import com.cinema.booking_service.dto.BookingDtos.TicketResponse;
import com.cinema.booking_service.entity.Booking;
import com.cinema.booking_service.entity.SeatInventory;
import com.cinema.booking_service.messaging.BookingDomainEvent;
import com.cinema.booking_service.repository.BookingRepository;
import com.cinema.booking_service.repository.SeatInventoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatInventoryRepository inventoryRepository;
    private final CatalogClient catalogClient;
    private final MockPaymentProvider paymentProvider;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;
    private final Duration seatLockDuration;
    private final Duration cancellationCutoff;

    public BookingService(
            BookingRepository bookingRepository,
            SeatInventoryRepository inventoryRepository,
            CatalogClient catalogClient,
            MockPaymentProvider paymentProvider,
            ApplicationEventPublisher eventPublisher,
            Clock clock,
            @Value("${booking.seat-lock-duration:PT10M}") Duration seatLockDuration,
            @Value("${booking.cancellation-cutoff:PT2H}") Duration cancellationCutoff
    ) {
        this.bookingRepository = bookingRepository;
        this.inventoryRepository = inventoryRepository;
        this.catalogClient = catalogClient;
        this.paymentProvider = paymentProvider;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
        this.seatLockDuration = seatLockDuration;
        this.cancellationCutoff = cancellationCutoff;
    }

    @Transactional
    public SeatLockResponse lockSeats(Long userId, LockSeatsRequest request) {
        List<Long> requestedSeatIds = request.seatIds().stream().distinct().sorted().toList();
        if (requestedSeatIds.size() != request.seatIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The seat list contains duplicates.");
        }

        CatalogDtos.Showtime showtime = requireFutureShowtime(request.showtimeId());
        Map<Long, CatalogDtos.Seat> seatsOnScreen = catalogClient.getSeats(showtime.screenId()).stream()
                .collect(Collectors.toMap(CatalogDtos.Seat::id, Function.identity()));
        if (!seatsOnScreen.keySet().containsAll(requestedSeatIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more seats do not belong to this showtime.");
        }

        Instant now = clock.instant();
        Instant expiresAt = now.plus(seatLockDuration);
        String lockId = UUID.randomUUID().toString();
        List<SeatInventory> lockedSeats = new ArrayList<>();

        for (Long seatId : requestedSeatIds) {
            inventoryRepository.createIfMissing(showtime.id(), seatId);
            SeatInventory inventory = inventoryRepository.findForUpdate(showtime.id(), seatId)
                    .orElseThrow(() -> new IllegalStateException("Seat inventory could not be initialized."));

            if (inventory.getStatus() == SeatInventory.Status.LOCKED
                    && inventory.getLockExpiresAt() != null
                    && !inventory.getLockExpiresAt().isAfter(now)) {
                inventory.release();
            }
            if (inventory.getStatus() != SeatInventory.Status.AVAILABLE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat " + seatId + " is not available.");
            }
            inventory.lock(lockId, userId, expiresAt);
            lockedSeats.add(inventory);
        }

        inventoryRepository.saveAll(lockedSeats);
        return new SeatLockResponse(lockId, showtime.id(), expiresAt, requestedSeatIds);
    }

    @Transactional
    public List<SeatAvailability> seatAvailability(Long showtimeId) {
        CatalogDtos.Showtime showtime = requireFutureShowtime(showtimeId);
        List<CatalogDtos.Seat> catalogSeats = catalogClient.getSeats(showtime.screenId());
        Instant now = clock.instant();
        for (CatalogDtos.Seat seat : catalogSeats) {
            inventoryRepository.createIfMissing(showtimeId, seat.id());
        }

        Map<Long, SeatInventory> inventory = inventoryRepository.findByShowtimeIdOrderBySeatIdAsc(showtimeId)
                .stream().collect(Collectors.toMap(SeatInventory::getSeatId, Function.identity()));
        List<SeatAvailability> result = new ArrayList<>();
        for (CatalogDtos.Seat seat : catalogSeats) {
            SeatInventory row = inventory.get(seat.id());
            if (row == null) {
                throw new IllegalStateException("Seat inventory could not be initialized.");
            }
            if (row.getStatus() == SeatInventory.Status.LOCKED
                    && row.getLockExpiresAt() != null && !row.getLockExpiresAt().isAfter(now)) {
                row.release();
                inventoryRepository.save(row);
            }
            result.add(new SeatAvailability(seat.id(), seat.rowLabel(), seat.seatNumber(), seat.category(), row.getStatus()));
        }
        return result;
    }

    @Transactional
    public BookingResponse confirmBooking(Long userId, ConfirmBookingRequest request) {
        List<SeatInventory> lockedSeats = inventoryRepository
                .findByLockIdAndLockedByUserIdOrderBySeatIdAsc(request.lockId(), userId);
        if (lockedSeats.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat lock was not found or has expired.");
        }

        Instant now = clock.instant();
        if (lockedSeats.stream().anyMatch(seat -> seat.getLockExpiresAt() == null
                || !seat.getLockExpiresAt().isAfter(now))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat lock has expired. Select the seats again.");
        }
        Long showtimeId = lockedSeats.getFirst().getShowtimeId();
        if (lockedSeats.stream().anyMatch(seat -> !seat.getShowtimeId().equals(showtimeId))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat lock contains more than one showtime.");
        }

        CatalogDtos.Showtime showtime = requireFutureShowtime(showtimeId);
        List<Long> seatIds = lockedSeats.stream().map(SeatInventory::getSeatId).toList();
        BigDecimal amount = showtime.basePrice().multiply(BigDecimal.valueOf(seatIds.size()));
        String reference = "CB-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        String ticketCode = UUID.randomUUID().toString();

        Booking booking = new Booking(userId, showtimeId, showtime.startsAt(), reference, ticketCode, amount, seatIds);
        boolean paymentSucceeded = paymentProvider.charge(request.paymentOutcome());
        if (!paymentSucceeded) {
            booking.markPaymentFailed();
            Booking saved = bookingRepository.saveAndFlush(booking);
            lockedSeats.forEach(SeatInventory::release);
            inventoryRepository.saveAll(lockedSeats);
            return BookingResponse.from(saved);
        }

        Booking saved = bookingRepository.saveAndFlush(booking);
        lockedSeats.forEach(seat -> seat.reserve(saved.getId()));
        inventoryRepository.saveAll(lockedSeats);
        eventPublisher.publishEvent(new BookingDomainEvent(
                "BOOKING_CONFIRMED", saved.getId(), saved.getBookingReference(), saved.getUserId(),
                saved.getShowtimeId(), saved.getSeatIds(), saved.getAmount(), now
        ));
        return BookingResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BookingResponse::from).toList();
    }

    @Transactional
    public BookingResponse cancelBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking was not found."));
        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed bookings can be cancelled.");
        }

        Instant now = clock.instant();
        if (!now.isBefore(booking.getShowtimeStartsAt().minus(cancellationCutoff))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The cancellation cutoff has passed.");
        }

        booking.cancel(now);
        bookingRepository.save(booking);
        List<SeatInventory> reservedSeats = inventoryRepository.findByBookingIdOrderBySeatIdAsc(bookingId);
        reservedSeats.forEach(SeatInventory::release);
        inventoryRepository.saveAll(reservedSeats);
        eventPublisher.publishEvent(new BookingDomainEvent(
                "BOOKING_CANCELLED", booking.getId(), booking.getBookingReference(), booking.getUserId(),
                booking.getShowtimeId(), booking.getSeatIds(), booking.getAmount(), now
        ));
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicket(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking was not found."));
        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A ticket is available only for a confirmed booking.");
        }
        return new TicketResponse(booking.getBookingReference(), booking.getTicketCode(), booking.getShowtimeId(),
                booking.getShowtimeStartsAt(), booking.getSeatIds(), booking.getAmount());
    }

    @Scheduled(fixedDelayString = "${booking.expired-lock-cleanup-ms:30000}")
    @Transactional
    public void releaseExpiredLocks() {
        List<SeatInventory> expired = inventoryRepository.findByStatusAndLockExpiresAtLessThanEqual(
                SeatInventory.Status.LOCKED, clock.instant());
        expired.forEach(SeatInventory::release);
        inventoryRepository.saveAll(expired);
    }

    private CatalogDtos.Showtime requireFutureShowtime(Long showtimeId) {
        CatalogDtos.Showtime showtime = catalogClient.getShowtime(showtimeId);
        if (showtime == null || !showtime.active()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime was not found or is inactive.");
        }
        if (!showtime.startsAt().isAfter(clock.instant())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The showtime has already started.");
        }
        return showtime;
    }
}
