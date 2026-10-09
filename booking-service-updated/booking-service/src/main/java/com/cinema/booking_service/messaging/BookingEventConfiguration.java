package com.cinema.booking_service.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;

@Configuration
public class BookingEventConfiguration {

    public static final String EXCHANGE = "cinema.booking.events";
    public static final String CONFIRMED_QUEUE = "cinema.booking.confirmed";
    public static final String CANCELLED_QUEUE = "cinema.booking.cancelled";

    @Bean
    TopicExchange bookingEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue bookingConfirmedQueue() {
        return new Queue(CONFIRMED_QUEUE, true);
    }

    @Bean
    Queue bookingCancelledQueue() {
        return new Queue(CANCELLED_QUEUE, true);
    }

    @Bean
    Binding bookingConfirmedBinding(
            @Qualifier("bookingConfirmedQueue") Queue bookingConfirmedQueue,
            TopicExchange bookingEventsExchange
    ) {
        return BindingBuilder.bind(bookingConfirmedQueue).to(bookingEventsExchange).with("booking.confirmed");
    }

    @Bean
    Binding bookingCancelledBinding(
            @Qualifier("bookingCancelledQueue") Queue bookingCancelledQueue,
            TopicExchange bookingEventsExchange
    ) {
        return BindingBuilder.bind(bookingCancelledQueue).to(bookingEventsExchange).with("booking.cancelled");
    }
}
