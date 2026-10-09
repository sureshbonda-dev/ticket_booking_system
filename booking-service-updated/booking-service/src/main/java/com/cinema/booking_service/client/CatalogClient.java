package com.cinema.booking_service.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class CatalogClient {

    private final RestClient restClient;

    public CatalogClient(
            @Qualifier("loadBalancedRestClientBuilder") RestClient.Builder builder,
            @Value("${catalog-service.base-url:http://catalog-service}") String baseUrl
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public CatalogDtos.Showtime getShowtime(Long showtimeId) {
        return restClient.get()
                .uri("/api/catalog/showtimes/{showtimeId}", showtimeId)
                .retrieve()
                .body(CatalogDtos.Showtime.class);
    }

    public List<CatalogDtos.Seat> getSeats(Long screenId) {
        List<CatalogDtos.Seat> seats = restClient.get()
                .uri("/api/catalog/screens/{screenId}/seats", screenId)
                .retrieve()
                .body(new ParameterizedTypeReference<>() { });
        return seats == null ? List.of() : seats;
    }
}
