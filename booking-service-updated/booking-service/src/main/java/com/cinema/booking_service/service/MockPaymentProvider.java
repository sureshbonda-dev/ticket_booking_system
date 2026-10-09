package com.cinema.booking_service.service;

import com.cinema.booking_service.dto.BookingDtos.MockPaymentOutcome;
import org.springframework.stereotype.Component;

@Component
public class MockPaymentProvider {

    public boolean charge(MockPaymentOutcome outcome) {
        return outcome == null || outcome == MockPaymentOutcome.SUCCESS;
    }
}
