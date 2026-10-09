# Catalog Service

Catalog service runs on port `8081` and stores movies, theaters, screens, seats, and showtimes in `cinema_catalog`.

The local defaults are PostgreSQL user `postgres`, password `root`, and database port `5432`. Open this folder in IntelliJ as a Maven project and run `CatalogServiceApplication`. The database must already exist. To use different local credentials, set `DB_USERNAME`, `DB_PASSWORD`, or `DB_URL` in the IntelliJ Run Configuration.

## API

Browse without a token:

- `GET /api/catalog/movies?title=&genre=&city=`
- `GET /api/catalog/movies/{movieId}`
- `GET /api/catalog/theaters?city=`
- `GET /api/catalog/theaters/{theaterId}/screens`
- `GET /api/catalog/screens/{screenId}/seats`
- `GET /api/catalog/showtimes?movieId=&city=&from=`
- `GET /api/catalog/showtimes/{showtimeId}`

All writes are under `/api/catalog/admin/**` and require an ADMIN JWT. Create records with `POST` and update them with `PUT` for `/movies`, `/theaters`, `/screens`, and `/showtimes`. Seats are added with `POST /api/catalog/admin/seats`. Movies and showtimes can be deactivated with `DELETE` on their admin paths.

Example movie body:

```json
{
  "title": "Example Film",
  "description": "A sample movie description.",
  "genre": "Drama",
  "durationMinutes": 110,
  "rating": 8.2,
  "posterUrl": "https://example.com/poster.jpg"
}
```

`spring.jpa.hibernate.ddl-auto=update` creates and updates tables for this local development stage. Use database migrations before production.
