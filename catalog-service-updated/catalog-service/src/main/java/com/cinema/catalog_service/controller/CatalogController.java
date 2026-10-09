package com.cinema.catalog_service.controller;

import com.cinema.catalog_service.dto.CatalogDtos.MovieRequest;
import com.cinema.catalog_service.dto.CatalogDtos.MovieResponse;
import com.cinema.catalog_service.dto.CatalogDtos.TheaterRequest;
import com.cinema.catalog_service.dto.CatalogDtos.TheaterResponse;
import com.cinema.catalog_service.dto.CatalogDtos.ScreenRequest;
import com.cinema.catalog_service.dto.CatalogDtos.ScreenResponse;
import com.cinema.catalog_service.dto.CatalogDtos.SeatRequest;
import com.cinema.catalog_service.dto.CatalogDtos.SeatResponse;
import com.cinema.catalog_service.dto.CatalogDtos.ShowtimeRequest;
import com.cinema.catalog_service.dto.CatalogDtos.ShowtimeResponse;
import com.cinema.catalog_service.entity.Movie;
import com.cinema.catalog_service.entity.Screen;
import com.cinema.catalog_service.entity.Seat;
import com.cinema.catalog_service.entity.Showtime;
import com.cinema.catalog_service.entity.Theater;
import com.cinema.catalog_service.repository.MovieRepository;
import com.cinema.catalog_service.repository.ScreenRepository;
import com.cinema.catalog_service.repository.SeatRepository;
import com.cinema.catalog_service.repository.ShowtimeRepository;
import com.cinema.catalog_service.repository.TheaterRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;

    public CatalogController(
            MovieRepository movieRepository,
            TheaterRepository theaterRepository,
            ScreenRepository screenRepository,
            SeatRepository seatRepository,
            ShowtimeRepository showtimeRepository
    ) {
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
        this.seatRepository = seatRepository;
        this.showtimeRepository = showtimeRepository;
    }

    @GetMapping("/movies")
    public List<MovieResponse> searchMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String city
    ) {
        return movieRepository.search(blankToNull(title), blankToNull(genre), blankToNull(city))
                .stream().map(this::toMovieResponse).toList();
    }

    @GetMapping("/movies/{movieId}")
    public MovieResponse getMovie(@PathVariable Long movieId) {
        return toMovieResponse(movieRepository.findByIdAndActiveTrue(movieId)
                .orElseThrow(() -> notFound("Movie")));
    }

    @GetMapping("/theaters")
    public List<TheaterResponse> theaters(@RequestParam(required = false) String city) {
        List<Theater> theaters = blankToNull(city) == null
                ? theaterRepository.findAll()
                : theaterRepository.findByCityIgnoreCaseOrderByNameAsc(city.trim());
        return theaters.stream().map(this::toTheaterResponse).toList();
    }

    @GetMapping("/theaters/{theaterId}/screens")
    public List<ScreenResponse> screens(@PathVariable Long theaterId) {
        requireTheater(theaterId);
        return screenRepository.findByTheaterIdOrderByNameAsc(theaterId)
                .stream().map(this::toScreenResponse).toList();
    }

    @GetMapping("/screens/{screenId}/seats")
    public List<SeatResponse> seats(@PathVariable Long screenId) {
        requireScreen(screenId);
        return seatRepository.findByScreenIdOrderByRowLabelAscSeatNumberAsc(screenId)
                .stream().map(this::toSeatResponse).toList();
    }

    @GetMapping("/showtimes")
    public List<ShowtimeResponse> showtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Instant from
    ) {
        return showtimeRepository.search(movieId, blankToNull(city), from == null ? Instant.now() : from)
                .stream().map(this::toShowtimeResponse).toList();
    }

    @GetMapping("/showtimes/{showtimeId}")
    public ShowtimeResponse getShowtime(@PathVariable Long showtimeId) {
        return toShowtimeResponse(requireShowtime(showtimeId));
    }

    @PostMapping("/admin/movies")
    @ResponseStatus(HttpStatus.CREATED)
    public MovieResponse createMovie(@Valid @RequestBody MovieRequest request) {
        return toMovieResponse(movieRepository.save(new Movie(
                request.title(), request.description(), request.genre(), request.durationMinutes(),
                request.rating(), request.posterUrl()
        )));
    }

    @PutMapping("/admin/movies/{movieId}")
    public MovieResponse updateMovie(@PathVariable Long movieId, @Valid @RequestBody MovieRequest request) {
        Movie movie = movieRepository.findById(movieId).orElseThrow(() -> notFound("Movie"));
        movie.update(request.title(), request.description(), request.genre(), request.durationMinutes(),
                request.rating(), request.posterUrl());
        return toMovieResponse(movieRepository.save(movie));
    }

    @DeleteMapping("/admin/movies/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateMovie(@PathVariable Long movieId) {
        Movie movie = movieRepository.findById(movieId).orElseThrow(() -> notFound("Movie"));
        movie.deactivate();
        movieRepository.save(movie);
    }

    @PostMapping("/admin/theaters")
    @ResponseStatus(HttpStatus.CREATED)
    public TheaterResponse createTheater(@Valid @RequestBody TheaterRequest request) {
        return toTheaterResponse(theaterRepository.save(new Theater(
                request.name(), request.city(), request.address()
        )));
    }

    @PutMapping("/admin/theaters/{theaterId}")
    public TheaterResponse updateTheater(@PathVariable Long theaterId, @Valid @RequestBody TheaterRequest request) {
        Theater theater = requireTheater(theaterId);
        theater.update(request.name(), request.city(), request.address());
        return toTheaterResponse(theaterRepository.save(theater));
    }

    @PostMapping("/admin/screens")
    @ResponseStatus(HttpStatus.CREATED)
    public ScreenResponse createScreen(@Valid @RequestBody ScreenRequest request) {
        Theater theater = requireTheater(request.theaterId());
        return toScreenResponse(screenRepository.save(new Screen(
                theater, request.name(), request.rows(), request.columns()
        )));
    }

    @PutMapping("/admin/screens/{screenId}")
    public ScreenResponse updateScreen(@PathVariable Long screenId, @Valid @RequestBody ScreenRequest request) {
        Screen screen = requireScreen(screenId);
        screen.update(requireTheater(request.theaterId()), request.name(), request.rows(), request.columns());
        return toScreenResponse(screenRepository.save(screen));
    }

    @PostMapping("/admin/seats")
    @ResponseStatus(HttpStatus.CREATED)
    public SeatResponse createSeat(@Valid @RequestBody SeatRequest request) {
        Screen screen = requireScreen(request.screenId());
        if (request.seatNumber() > screen.getColumns()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seat number exceeds the screen column count.");
        }
        if (rowIndex(request.rowLabel()) > screen.getRows()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Row label exceeds the screen row count.");
        }
        return toSeatResponse(seatRepository.save(new Seat(
                screen, request.rowLabel(), request.seatNumber(), request.category()
        )));
    }

    @PostMapping("/admin/showtimes")
    @ResponseStatus(HttpStatus.CREATED)
    public ShowtimeResponse createShowtime(@Valid @RequestBody ShowtimeRequest request) {
        Movie movie = movieRepository.findByIdAndActiveTrue(request.movieId())
                .orElseThrow(() -> notFound("Movie"));
        Screen screen = requireScreen(request.screenId());
        return toShowtimeResponse(showtimeRepository.save(new Showtime(
                movie, screen, request.startsAt(), request.basePrice()
        )));
    }

    @PutMapping("/admin/showtimes/{showtimeId}")
    public ShowtimeResponse updateShowtime(
            @PathVariable Long showtimeId,
            @Valid @RequestBody ShowtimeRequest request
    ) {
        Showtime showtime = showtimeRepository.findById(showtimeId).orElseThrow(() -> notFound("Showtime"));
        Movie movie = movieRepository.findByIdAndActiveTrue(request.movieId())
                .orElseThrow(() -> notFound("Movie"));
        showtime.update(movie, requireScreen(request.screenId()), request.startsAt(), request.basePrice());
        return toShowtimeResponse(showtimeRepository.save(showtime));
    }

    @DeleteMapping("/admin/showtimes/{showtimeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateShowtime(@PathVariable Long showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId).orElseThrow(() -> notFound("Showtime"));
        showtime.deactivate();
        showtimeRepository.save(showtime);
    }

    private Theater requireTheater(Long id) {
        return theaterRepository.findById(id).orElseThrow(() -> notFound("Theater"));
    }

    private Screen requireScreen(Long id) {
        return screenRepository.findById(id).orElseThrow(() -> notFound("Screen"));
    }

    private Showtime requireShowtime(Long id) {
        return showtimeRepository.findByIdAndActiveTrue(id).orElseThrow(() -> notFound("Showtime"));
    }

    private MovieResponse toMovieResponse(Movie movie) {
        return new MovieResponse(movie.getId(), movie.getTitle(), movie.getDescription(), movie.getGenre(),
                movie.getDurationMinutes(), movie.getRating(), movie.getPosterUrl(), movie.isActive());
    }

    private TheaterResponse toTheaterResponse(Theater theater) {
        return new TheaterResponse(theater.getId(), theater.getName(), theater.getCity(), theater.getAddress());
    }

    private ScreenResponse toScreenResponse(Screen screen) {
        return new ScreenResponse(screen.getId(), screen.getTheater().getId(), screen.getTheater().getName(),
                screen.getName(), screen.getRows(), screen.getColumns());
    }

    private SeatResponse toSeatResponse(Seat seat) {
        return new SeatResponse(seat.getId(), seat.getScreen().getId(), seat.getRowLabel(), seat.getSeatNumber(),
                seat.getCategory());
    }

    private ShowtimeResponse toShowtimeResponse(Showtime showtime) {
        Screen screen = showtime.getScreen();
        Theater theater = screen.getTheater();
        Movie movie = showtime.getMovie();
        return new ShowtimeResponse(showtime.getId(), movie.getId(), movie.getTitle(), screen.getId(),
                screen.getName(), theater.getId(), theater.getName(), theater.getCity(), showtime.getStartsAt(),
                showtime.getEndsAt(), showtime.getBasePrice(), showtime.isActive());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int rowIndex(String rowLabel) {
        int index = 0;
        for (char character : rowLabel.trim().toUpperCase(Locale.ROOT).toCharArray()) {
            if (character < 'A' || character > 'Z') {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Row labels must use letters A-Z.");
            }
            index = index * 26 + character - 'A' + 1;
        }
        return index;
    }

    private ResponseStatusException notFound(String type) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, type + " was not found.");
    }
}
