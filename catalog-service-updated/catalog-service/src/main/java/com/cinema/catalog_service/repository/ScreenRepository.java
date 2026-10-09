package com.cinema.catalog_service.repository;

import com.cinema.catalog_service.entity.Screen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByTheaterIdOrderByNameAsc(Long theaterId);
}
