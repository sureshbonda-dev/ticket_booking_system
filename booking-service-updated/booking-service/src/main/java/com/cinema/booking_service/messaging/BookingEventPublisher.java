package com.cinema.booking_service.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.stream.Collectors;

@Component
public class BookingEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public BookingEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(BookingDomainEvent event) {
        String seatIds = event.seatIds().stream().map(String::valueOf).collect(Collectors.joining(","));
        String json = "{\"eventType\":\"%s\",\"bookingId\":%d,\"bookingReference\":\"%s\","
                .formatted(event.eventType(), event.bookingId(), event.bookingReference())
                + "\"userId\":%d,\"showtimeId\":%d,\"seatIds\":[%s],\"amount\":%s,\"occurredAt\":\"%s\"}"
                .formatted(event.userId(), event.showtimeId(), seatIds, event.amount().toPlainString(),
                        event.occurredAt());
        String routingKey = event.eventType().equals("BOOKING_CANCELLED")
                ? "booking.cancelled" : "booking.confirmed";
        rabbitTemplate.convertAndSend(BookingEventConfiguration.EXCHANGE, routingKey, json);
    }
}
