package com.cinema.catalog_service.repository;

import com.cinema.catalog_service.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TheaterRepository extends JpaRepository<Theater, Long> {
    List<Theater> findByCityIgnoreCaseOrderByNameAsc(String city);
}
