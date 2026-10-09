package com.cinema.auth_service.service;

import com.cinema.auth_service.dto.AuthResponse;
import com.cinema.auth_service.dto.LoginRequest;
import com.cinema.auth_service.dto.ProfileUpdateRequest;
import com.cinema.auth_service.dto.RegisterRequest;
import com.cinema.auth_service.dto.RoleUpdateRequest;
import com.cinema.auth_service.dto.UserResponse;
import com.cinema.auth_service.entity.User;
import com.cinema.auth_service.exception.EmailAlreadyExistsException;
import com.cinema.auth_service.exception.InvalidCredentialsException;
import com.cinema.auth_service.exception.UserNotFoundException;
import com.cinema.auth_service.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException();
        }
        ensureBcryptPasswordLength(request.password());

        User user = new User(
                request.fullName().trim(),
                email,
                normalizePhone(request.phoneNumber()),
                passwordEncoder.encode(request.password())
        );

        try {
            User savedUser = userRepository.saveAndFlush(user);
            return tokenService.createFor(savedUser);
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyExistsException();
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return tokenService.createFor(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(String userId) {
        return UserResponse.from(findUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(String userId, ProfileUpdateRequest request) {
        User user = findUser(userId);
        user.updateProfile(request.fullName().trim(), normalizePhone(request.phoneNumber()));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse updateRole(Long userId, RoleUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        user.changeRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    private User findUser(String userId) {
        try {
            return userRepository.findById(Long.parseLong(userId))
                    .orElseThrow(UserNotFoundException::new);
        } catch (NumberFormatException exception) {
            throw new UserNotFoundException();
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }
        return phoneNumber.trim();
    }

    private void ensureBcryptPasswordLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must be no more than 72 UTF-8 bytes.");
        }
    }
}
