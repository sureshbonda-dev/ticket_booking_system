package com.cinema.catalog_service.repository;

import com.cinema.catalog_service.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    @Query("""
            select distinct m from Movie m
            left join Showtime sh on sh.movie = m
            left join sh.screen sc
            left join sc.theater t
            where m.active = true
              and (coalesce(:title, '') = ''
                   or lower(m.title) like lower(concat('%', coalesce(:title, ''), '%')))
              and (coalesce(:genre, '') = ''
                   or lower(m.genre) like lower(concat('%', coalesce(:genre, ''), '%')))
              and (coalesce(:city, '') = ''
                   or lower(t.city) = lower(coalesce(:city, '')))
            order by m.title
            """)
    List<Movie> search(
            @Param("title") String title,
            @Param("genre") String genre,
            @Param("city") String city
    );

    Optional<Movie> findByIdAndActiveTrue(Long id);
}