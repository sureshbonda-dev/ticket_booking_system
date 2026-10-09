package com.cinema.auth_service.service;

import com.cinema.auth_service.dto.AuthResponse;
import com.cinema.auth_service.dto.UserResponse;
import com.cinema.auth_service.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final Clock clock;
    private final String issuer;
    private final Duration tokenTtl;

    public TokenService(
            JwtEncoder jwtEncoder,
            Clock clock,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.access-token-ttl:PT1H}") Duration tokenTtl
    ) {
        this.jwtEncoder = jwtEncoder;
        this.clock = clock;
        this.issuer = issuer;
        this.tokenTtl = tokenTtl;
    }

    public AuthResponse createFor(User user) {
        Instant issuedAt = clock.instant();
        Instant expiresAt = issuedAt.plus(tokenTtl);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims
        )).getTokenValue();

        return new AuthResponse(
                token,
                "Bearer",
                tokenTtl.toSeconds(),
                UserResponse.from(user)
        );
    }
}
