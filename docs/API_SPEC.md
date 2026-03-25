# RealmOs – API Specification

## Base URL
```
http://<EC2_IP>:8080/api/v1
```

## Standard Response Format
```json
{
  "success": true,
  "data": {},
  "error": ""
}
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <jwt>     ← JWT from login/register response
X-User-ID: <user_uuid>          ← optional for local/dev testing
```

---

## Authentication & User Management

### Auth Module Overview
- PIN-based login with bcrypt hashing (no plaintext PINs)
- JWT access tokens for API auth (90-day TTL)
- Optional remember-me via refresh tokens stored in memory (Redis in production)
- OTP-based PIN reset stored in memory with expiry + attempt limits

### Design Rationale (WHY)
- PIN + bcrypt keeps login simple while resisting offline brute force.
- JWT keeps requests stateless and fast for a mobile app.
- In-memory OTP/refresh storage keeps the stack light; Redis is the drop-in scale upgrade.

### Remember Me (HOW)
- When `remember_me=true`, the server issues a refresh token stored as a SHA-256 hash.
- The client calls `/auth/refresh` with that token to mint a new JWT without re-entering the PIN.

### Backend Layers (Clean Architecture)
- Controller: `auth/handler.go` (HTTP + validation)
- Service/Repo: `auth/repository.go` (auth logic + DB access)
- Models: `auth/model.go` (request/response DTOs)

### Auth Flow Overview

```
Register:  POST /auth/register  →  JWT + user info
Login:     POST /auth/login     →  JWT + user info
Remember:  (optional) remember_me=true → refresh token returned
Forgot PIN:
  1. POST /auth/forgot-pin      →  OTP generated (dev: returned in body)
  2. POST /auth/verify-otp      →  check OTP validity (optional)
  3. POST /auth/reset-pin       →  OTP + new PIN → success
Refresh:   POST /auth/refresh   →  new JWT from refresh token
```

### Endpoints

| Method | Path                 | Description                              |
|--------|----------------------|------------------------------------------|
| POST   | /auth/register       | Create account (username + PIN + goals)  |
| POST   | /auth/login          | Sign in (username + PIN)                 |
| POST   | /auth/forgot-pin     | Request OTP for PIN reset                |
| POST   | /auth/verify-otp     | Verify OTP is valid (optional pre-check) |
| POST   | /auth/reset-pin      | Reset PIN using OTP                      |
| POST   | /auth/refresh        | Exchange refresh token for new JWT       |

### POST /auth/register
```json
// Request
{
  "username": "dipti_queen",
  "name": "Dipti",
  "pin": "1234",
  "confirm_pin": "1234",
  "email": "dipti@example.com",
  "goals": ["health", "periods", "skin"]
}

// Response 201
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "token_expiry": 1738000000,
    "user": {
      "id": "uuid",
      "name": "Dipti",
      "username": "dipti_queen",
      "onboarded": false
    }
  }
}
```

### POST /auth/login
```json
// Request
{ "username": "dipti_queen", "pin": "1234", "remember_me": true }

// Response 200 — same shape as register
// If remember_me=true, includes refresh_token + refresh_token_expiry
// Response 401 — { "success": false, "error": "incorrect username or PIN" }
// Response 429 — { "success": false, "error": "too many failed attempts..." }
```

### POST /auth/forgot-pin
```json
// Request
{ "username": "dipti_queen" }
// or
{ "email": "dipti@example.com" }

// Response 200
{ "message": "If that account is registered, an OTP has been sent.",
  "otp": "123456"  // only in dev mode (ENV != production)
}
```

### POST /auth/verify-otp
```json
// Request
{ "username": "dipti_queen", "otp": "123456" }
// or
{ "email": "dipti@example.com", "otp": "123456" }

// Response 200
{ "verified": true, "message": "OTP verified" }
// Response 400 — invalid/expired OTP
// Response 429 — too many attempts
```

### POST /auth/reset-pin
```json
// Request
{ "username": "dipti_queen", "otp": "123456", "new_pin": "9999" }
// or
{ "email": "dipti@example.com", "otp": "123456", "new_pin": "9999" }

// Response 200
{ "message": "PIN reset successfully. Please log in." }
```

### POST /auth/refresh
```json
// Request
{ "refresh_token": "refresh_token_here" }

// Response 200
{ "token": "eyJ...", "token_expiry": 1738000000 }
```

### Security notes
- PIN stored as bcrypt hash (cost 10) — never stored in plaintext
- 5 failed login attempts → 15-minute lockout per username (in-memory)
- OTP is 6 digits, expires in 10 minutes, max 3 verify attempts
- OTP stored as SHA-256 hash in memory — never stored plaintext
- JWT uses HS256, 90-day TTL (personal app — convenience over strict rotation)
- Refresh tokens are random 256-bit values stored as SHA-256 hashes in memory

### Data Models (Auth)
- users: id, username, email, password_hash, onboarded, created_at, updated_at
- user_goals: user_id, priority_areas (signup goals)
- in-memory caches: login attempts, OTPs, refresh tokens

### Flow Diagrams (text)
```
[Register] -> validate fields + goals -> bcrypt PIN -> users + user_goals -> JWT
[Login] -> rate limit -> bcrypt compare -> JWT -> (remember_me) refresh token
[Forgot PIN] -> lookup by username/email -> OTP -> hash -> cache -> response
[Verify OTP] -> lookup user -> check cache -> ok / error
[Reset PIN] -> verify OTP -> bcrypt new PIN -> update user -> invalidate OTP
[Refresh] -> validate refresh token -> mint new JWT
```

### Edge Cases
- Wrong PIN → 401 (increments lockout counter)
- Expired/invalid OTP → 400
- Invalid username/email → generic OTP response (no account leakage)
- Multiple OTP requests → latest OTP overwrites previous (expiry still enforced)

---

## Health

| Method | Path       | Description        |
|--------|------------|--------------------|
| GET    | /health    | Server health check |

---

## Users

| Method | Path              | Description                   |
|--------|-------------------|-------------------------------|
| POST   | /users            | Create user (onboarding step 1) |
| GET    | /users/:id        | Get user profile              |
| PUT    | /users/:id        | Update user profile           |
| PUT    | /users/:id/goals  | Update user goals             |
| GET    | /users/:id/goals  | Get user goals                |

### POST /users
```json
{
  "name": "Dipti",
  "age": 26,
  "height_cm": 162.0,
  "weight_kg": 58.5
}
```

---

## Quotes

| Method | Path              | Description                   |
|--------|-------------------|-------------------------------|
| GET    | /quotes/random    | Fetch a random motivational quote |

### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "She remembered who she was and the game changed.",
    "author": "Lalah Delia"
  }
}
```

---

## Period

| Method | Path                   | Description                      |
|--------|------------------------|----------------------------------|
| POST   | /period/profile        | Save period profile (onboarding) |
| GET    | /period/profile        | Get period profile               |
| PUT    | /period/profile        | Update period profile            |
| POST   | /period/log            | Log a period day                 |
| DELETE | /period/log/:date      | Remove a period day log          |
| GET    | /period/logs           | Get period days (date range)     |
| GET    | /period/logs/month     | Get all period days for a month  |

### POST /period/log
```json
{
  "log_date": "2025-03-15",
  "flow_level": "medium",
  "symptoms": ["cramps", "bloating"],
  "mood": "tired",
  "notes": "rough day"
}
```

### GET /period/logs?from=2025-03-01&to=2025-03-31
```json
{
  "success": true,
  "data": [
    {
      "log_date": "2025-03-15",
      "flow_level": "medium",
      "symptoms": ["cramps"],
      "mood": "tired"
    }
  ]
}
```

---

## Sleep

| Method | Path          | Description            |
|--------|---------------|------------------------|
| POST   | /sleep/log    | Log sleep for a date   |
| PUT    | /sleep/log    | Update sleep log       |
| GET    | /sleep/logs   | Get sleep logs (range) |

### POST /sleep/log
```json
{
  "log_date": "2025-03-15",
  "bedtime": "23:30",
  "wake_time": "07:00",
  "duration_hours": 7.5,
  "quality": 4,
  "notes": "slept well"
}
```

---

## Nutrition (Water / Protein / Carbs)

| Method | Path               | Description                      |
|--------|--------------------|----------------------------------|
| POST   | /nutrition/log     | Create or update nutrition log   |
| GET    | /nutrition/log     | Get nutrition for a date         |
| GET    | /nutrition/logs    | Get nutrition logs (range)       |

### POST /nutrition/log
```json
{
  "log_date": "2025-03-15",
  "water_ml": 2500,
  "protein_g": 45.0,
  "carbs_g": 180.0,
  "calories": 1800
}
```

---

## Exercise

| Method | Path              | Description           |
|--------|-------------------|-----------------------|
| POST   | /exercise/log     | Log a workout session |
| GET    | /exercise/logs    | Get exercise logs     |

### POST /exercise/log
```json
{
  "log_date": "2025-03-15",
  "session_type": "morning",
  "workout_type": "core",
  "duration_min": 30,
  "notes": "plank + crunches"
}
```

---

## Steps

| Method | Path           | Description       |
|--------|----------------|-------------------|
| POST   | /steps/log     | Log step count    |
| GET    | /steps/log     | Get steps by date |
| GET    | /steps/logs    | Get steps (range) |

---

## Savings

| Method | Path              | Description         |
|--------|-------------------|---------------------|
| POST   | /savings/log      | Add savings entry   |
| GET    | /savings/logs     | Get savings (range) |
| GET    | /savings/summary  | Monthly summary     |

---

## Investments

| Method | Path                 | Description            |
|--------|----------------------|------------------------|
| POST   | /investments/log     | Add investment entry   |
| GET    | /investments/logs    | Get investments        |

---

## Phase 2 (Future)

- Refresh token persistence (Redis)
- Insights endpoints (correlations, trends)
- Lifestyle Consistency Score (Sexiness Score)
- Hormone tracking
- Grocery planner
