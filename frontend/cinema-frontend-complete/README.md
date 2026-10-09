# Cinema frontend

A React/Vite frontend for the cinema booking microservices. Catalog, account, seat, booking, and admin data are loaded from the API Gateway; the frontend does not connect directly to PostgreSQL.

## Run it on Windows

1. Make sure Node.js is version `20.19+` or `22.12+` (`node -v`).
2. Extract this ZIP into `C:\ticket_booking_system\frontend\cinema-frontend` (replace the old preview files).
3. Keep PostgreSQL, RabbitMQ, Eureka, API Gateway, Auth Service, Catalog Service, and Booking Service running.
4. Open PowerShell and run:

   ```powershell
   cd C:\ticket_booking_system\frontend\cinema-frontend
   npm install
   npm run dev
   ```

5. Open the address printed by Vite (normally `http://localhost:5173`).

The API address defaults to `http://127.0.0.1:8080`. To change it, copy `.env.example` to `.env` and edit `VITE_API_BASE_URL`. Open the frontend at `http://localhost:5173` to match the gateway's local CORS setting.

## Features included

- Customer movie search, genre and city filters, theaters, and future showtimes.
- Registration, login, profile updates, and role-aware admin navigation.
- Authenticated seat map with available, locked, reserved, and VIP states; availability refreshes every 15 seconds.
- Temporary seat locks, checkout, and mock payment success/failure flow.
- Booking history, cancellation subject to the backend cutoff, ticket view, and PDF ticket download with its QR code.
- Admin overview counts, movie create/edit/deactivate, theater create/edit, screen and seat layout creation, showtime create/edit/deactivate, user role changes, and ticket verification.

The backend currently uses a mock payment provider. The dashboard shows catalog and user counts; the current backend does not provide an all-bookings reporting endpoint.

## Folder organization

- `src/features/catalog`: city-based discovery and catalog administration.
- `src/features/auth`: sign-up, sign-in, profiles, and user roles.
- `src/features/booking`: seat selection, temporary locks, and checkout.
- `src/features/account`: booking history, cancellation, and tickets.
- `src/features/admin`: catalog dashboard and ticket verification.
- `src/shared/api`: shared API Gateway request helper.
- `src/app`: navigation, session state, and protected routes.

This feature-based organization keeps each part of the customer and admin experience together.
