# RealmOs – System Architecture

## Overview

RealmOs is a personal life analytics mobile app built with a clean, feature-based
architecture. Every layer is separated by responsibility, making it easy to add
new features without breaking existing ones.

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│                 Mobile App                       │
│         React Native + TypeScript + Expo         │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Features  │  │ Navigation │  │  Services  │  │
│  └────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────┬───────────────────────┘
                          │ HTTP REST
┌─────────────────────────▼───────────────────────┐
│               Golang REST API                    │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Handlers  │  │  Services  │  │Repositories│  │
│  └────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────┬───────────────────────┘
                          │
┌─────────────────────────▼───────────────────────┐
│          PostgreSQL (AWS EC2 t2.micro)           │
└─────────────────────────────────────────────────┘
```

---

## Layers Explained

### Mobile (React Native)

| Layer       | Responsibility                              |
|-------------|---------------------------------------------|
| Screens     | UI rendering, user interaction              |
| Components  | Reusable UI building blocks                 |
| Hooks       | Shared stateful logic                       |
| Services    | All API calls (axios-based)                 |
| Store       | Local state (AsyncStorage + context)        |
| Navigation  | Stack + Tab + Drawer navigators             |
| Theme       | Colors, fonts, spacing constants            |

### Backend (Golang)

| Layer       | Responsibility                              |
|-------------|---------------------------------------------|
| Handler     | HTTP request/response, input validation     |
| Service     | Business logic                              |
| Repository  | Database queries (no raw SQL in services)   |
| Model       | Struct definitions matching DB tables       |
| Middleware  | Auth, logging, CORS, error recovery         |
| Config      | Environment variable loading                |

### Database (PostgreSQL)

- One migration file per feature
- Migrations run in numeric order
- Never edit old migrations — always add new ones

---

## Folder Structure

```
RealmOs/
├── mobile/                        # Expo React Native app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Button, Input, Card, etc.
│   │   │   └── layout/            # Screen wrappers, SafeArea
│   │   ├── features/              # One folder per feature
│   │   │   ├── onboarding/
│   │   │   ├── home/
│   │   │   ├── period/
│   │   │   ├── sleep/
│   │   │   ├── diet/
│   │   │   ├── exercise/
│   │   │   ├── water/
│   │   │   ├── acne/
│   │   │   ├── bloat/
│   │   │   ├── steps/
│   │   │   ├── selfie/
│   │   │   ├── savings/
│   │   │   └── investments/
│   │   ├── navigation/            # Root, Tab, Drawer navigators
│   │   ├── services/              # API client + per-feature services
│   │   ├── store/                 # Global state + AsyncStorage
│   │   ├── theme/                 # Colors, fonts, spacing
│   │   ├── hooks/                 # useQuote, useOnboarding, etc.
│   │   └── utils/                 # Date helpers, formatters
│   ├── assets/
│   ├── app.json
│   ├── App.tsx
│   ├── babel.config.js
│   └── package.json
│
├── backend/                       # Golang REST API
│   ├── cmd/server/main.go         # Entry point
│   ├── internal/
│   │   ├── config/                # Env config
│   │   ├── database/              # DB connection, migrations runner
│   │   ├── middleware/            # CORS, logger, recovery
│   │   └── features/              # One folder per domain
│   │       ├── user/
│   │       ├── period/
│   │       ├── sleep/
│   │       ├── diet/
│   │       ├── exercise/
│   │       ├── water/
│   │       ├── savings/
│   │       └── quotes/
│   ├── pkg/
│   │   ├── response/              # Standard API response helpers
│   │   └── validator/             # Input validation helpers
│   ├── migrations/                # SQL migration files
│   └── go.mod
│
├── database/
│   ├── migrations/                # Source of truth SQL scripts
│   └── seeds/                     # Dev seed data
│
└── docs/                          # All documentation
```

---

## API Design

- Base URL: `http://<EC2_IP>:8080/api/v1`
- All responses: `{ "success": bool, "data": {}, "error": "" }`
- Auth: JWT Bearer token (Phase 2)
- For Phase 1: user_id sent as header `X-User-ID`

---

## Data Flow Example (Period Log)

```
User taps "Mark Period Day"
  → PeriodScreen calls periodService.logPeriodDay(date)
    → axios POST /api/v1/period/log
      → Handler validates input
        → Service calls Repository
          → Repository writes to PostgreSQL
            → 200 OK response
              → UI updates calendar
```

---

## Deployment Plan

| Target       | Method                                    |
|--------------|-------------------------------------------|
| Backend      | Binary on AWS EC2 t2.micro, systemd       |
| Database     | PostgreSQL on same EC2 instance           |
| Mobile       | Expo build → .apk → install on phone      |
| Config       | .env file on server, app config in Expo   |

---

## Key Decisions

1. **No ORM** — raw SQL via `pgx` driver. Easier to read, debug, and optimize.
2. **No Redux** — Context API + AsyncStorage for Phase 1. Simple and sufficient.
3. **Feature-based folders** — every feature is self-contained. Easy to add/delete.
4. **Single user** — this is a personal app. No multi-tenancy complexity.
5. **REST only** — no GraphQL. Simpler to build and debug on mobile.
