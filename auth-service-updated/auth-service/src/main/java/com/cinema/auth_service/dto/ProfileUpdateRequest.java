package com.cinema.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 30) String phoneNumber
) {
}
