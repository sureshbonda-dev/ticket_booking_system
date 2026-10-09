package com.cinema.booking_service.repository;

import com.cinema.booking_service.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Booking> findByIdAndUserId(Long id, Long userId);
    Optional<Booking> findByTicketCodeAndStatus(String ticketCode, Booking.Status status);
}
