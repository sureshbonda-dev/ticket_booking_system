# Auth Service

Authentication and profile API for the cinema booking application.

## Run locally in IntelliJ

Requirements: JDK 21, PostgreSQL, and the `cinema_users` database. The service defaults to PostgreSQL user `postgres` with password `root`, database port `5432`, and service port `8083`.

1. Start PostgreSQL and Eureka (`http://localhost:8761`).
2. Open this folder in IntelliJ and wait for Maven to import the project.
3. Run `AuthServiceApplication`.

If your PostgreSQL username/password differ, set `DB_USERNAME` and `DB_PASSWORD` in the Run Configuration environment variables. `DB_URL` can override the JDBC URL. For non-local use, set `JWT_SECRET` to a private value of at least 32 bytes; the included default is only for local development.

## Endpoints

All endpoints are under `http://localhost:8083/api/auth`.

| Method | Path | Access |
| --- | --- | --- |
| POST | `/register` | Public; creates a CUSTOMER account and returns a JWT |
| POST | `/login` | Public; verifies credentials and returns a JWT |
| GET | `/me` | Signed-in user |
| PUT | `/me` | Signed-in user; updates name and phone number |
| GET | `/admin/users` | ADMIN only |
| PATCH | `/admin/users/{userId}/role` | ADMIN only |

Register request:

```json
{
  "fullName": "Alex Customer",
  "email": "alex@example.com",
  "phoneNumber": "555-0100",
  "password": "ChooseASecret123"
}
```

Use the returned `accessToken` on protected requests as:

```text
Authorization: Bearer <accessToken>
```

Registration always creates a CUSTOMER. To create the first administrator, register the account, then run this SQL in the `cinema_users` database (replace the email):

```sql
UPDATE app_users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Log in again after changing the role so the new JWT contains the ADMIN role. Do not return JPA entities directly from controllers; API responses use DTOs so password hashes are never sent to clients.
