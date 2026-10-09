package com.cinema.catalog_service.repository;

import com.cinema.catalog_service.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    @Query("""
            select sh from Showtime sh
            where sh.active = true
              and sh.startsAt >= :from
              and (:movieId is null or sh.movie.id = :movieId)
              and (:city is null or lower(sh.screen.theater.city) = lower(:city))
            order by sh.startsAt
            """)
    List<Showtime> search(@Param("movieId") Long movieId, @Param("city") String city,
                          @Param("from") Instant from);

    Optional<Showtime> findByIdAndActiveTrue(Long id);
}
