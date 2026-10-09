package com.cinema.auth_service.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException() {
        super("User was not found.");
    }
}
