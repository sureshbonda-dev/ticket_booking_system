package com.cinema.auth_service.dto;

import com.cinema.auth_service.entity.User;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull User.Role role) {
}
