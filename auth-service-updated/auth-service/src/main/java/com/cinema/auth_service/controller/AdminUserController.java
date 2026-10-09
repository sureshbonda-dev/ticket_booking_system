package com.cinema.auth_service.controller;

import com.cinema.auth_service.dto.RoleUpdateRequest;
import com.cinema.auth_service.dto.UserResponse;
import com.cinema.auth_service.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/admin/users")
public class AdminUserController {

    private final AuthService authService;

    public AdminUserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public List<UserResponse> listUsers() {
        return authService.listUsers();
    }

    @PatchMapping("/{userId}/role")
    public UserResponse updateRole(
            @PathVariable Long userId,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return authService.updateRole(userId, request);
    }
}
