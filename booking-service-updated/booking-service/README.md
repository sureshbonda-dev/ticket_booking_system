# Booking Service

Booking service runs on port `8082` and uses the `cinema_booking` database and RabbitMQ at `localhost:5672`. Open this folder in IntelliJ as a Maven project and run `BookingServiceApplication`. PostgreSQL, RabbitMQ, Eureka, and catalog-service should be running first.

Local PostgreSQL defaults are user `postgres`, password `root`, and port `5432`. RabbitMQ defaults are `guest` / `guest`. Set `DB_USERNAME`, `DB_PASSWORD`, `DB_URL`, or the `RABBITMQ_*` variables in the IntelliJ Run Configuration to override them. If `JWT_SECRET` is changed, use the same value in auth-service, gateway, and catalog-service.

## Booking flow

1. Read seat status with `GET /api/seats/showtimes/{showtimeId}`.
2. Lock up to 10 seats with `POST /api/bookings/locks`.
3. Confirm with `POST /api/bookings/confirm`; use `paymentOutcome` `SUCCESS` or `FAILURE` to simulate the mock payment.
4. View history at `GET /api/bookings/my`; cancel with `POST /api/bookings/{bookingId}/cancel`; download the ticket at `GET /api/bookings/{bookingId}/ticket.pdf`.

All booking endpoints require `Authorization: Bearer <accessToken>` from auth-service. The default seat lock lasts 10 minutes. Eligible cancellations are fully refunded in the mock-payment flow until 2 hours before the showtime. Confirmed and cancelled bookings publish messages to the durable `cinema.booking.events` RabbitMQ exchange and its `cinema.booking.confirmed` / `cinema.booking.cancelled` queues.

Seat ownership is checked against catalog-service through Eureka before locks are created. Seat rows in the booking database are locked transactionally to prevent two customers from holding the same seat at once.
