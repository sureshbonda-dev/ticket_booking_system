package com.cinema.booking_service.repository;

import com.cinema.booking_service.entity.SeatInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SeatInventoryRepository extends JpaRepository<SeatInventory, Long> {

    @Modifying
    @Query(value = """
            insert into seat_inventory (showtime_id, seat_id, status)
            values (:showtimeId, :seatId, 'AVAILABLE')
            on conflict (showtime_id, seat_id) do nothing
            """, nativeQuery = true)
    int createIfMissing(@Param("showtimeId") Long showtimeId, @Param("seatId") Long seatId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select inventory from SeatInventory inventory " +
            "where inventory.showtimeId = :showtimeId and inventory.seatId = :seatId")
    Optional<SeatInventory> findForUpdate(
            @Param("showtimeId") Long showtimeId,
            @Param("seatId") Long seatId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<SeatInventory> findByLockIdAndLockedByUserIdOrderBySeatIdAsc(String lockId, Long lockedByUserId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<SeatInventory> findByBookingIdOrderBySeatIdAsc(Long bookingId);

    List<SeatInventory> findByShowtimeIdOrderBySeatIdAsc(Long showtimeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<SeatInventory> findByStatusAndLockExpiresAtLessThanEqual(SeatInventory.Status status, Instant now);
}
