# API Gateway

The gateway listens on port `8080`, registers with Eureka, and routes API requests by service name.

Open this folder in IntelliJ as a Gradle project and run `ApiGatewayApplication`. Start Eureka and the backend services first. Routes are `/api/auth/**` to auth-service, `/api/catalog/**` to catalog-service, and `/api/bookings/**` plus `/api/seats/**` to booking-service.

Registration and login are public. Movie and catalog GET requests are public. Other requests need a JWT from auth-service; admin paths require the ADMIN role. CORS allows `http://localhost:5173` by default. Set `FRONTEND_ORIGIN` in the IntelliJ Run Configuration if React uses another origin. Set `JWT_SECRET` identically in auth-service, gateway, catalog-service, and booking-service if you override the local development default.
