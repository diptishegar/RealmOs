# RealmOs

> Your life. Your data. Your realm.

A personal life analytics mobile app — tracking periods, sleep, diet, exercise,
finances, skin health, and more. Turns your daily habits into insights.

---

## Tech Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Mobile   | React Native + TypeScript + Expo        |
| Backend  | Golang (Gin framework)                  |
| Database | PostgreSQL on AWS EC2 t2.micro          |
| Build    | EAS Build → downloadable Android APK   |

---

## Project Structure

```
RealmOs/
├── mobile/     # React Native Expo app
├── backend/    # Golang REST API
├── database/   # SQL migration scripts
└── docs/       # All documentation
```

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your DB credentials in .env
go mod tidy
go run cmd/server/main.go
```

### Database (run migrations in order)

```bash
psql -h <HOST> -U realmos_user -d realmos -f database/migrations/001_init.sql
psql -h <HOST> -U realmos_user -d realmos -f database/migrations/002_period.sql
psql -h <HOST> -U realmos_user -d realmos -f database/migrations/003_sleep_nutrition_exercise.sql
```

### Mobile

```bash
cd mobile
npm install
npx expo start
# Scan the QR with Expo Go on your phone
```

### Build APK for Android

```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# Download the .apk from the URL provided
# Enable "Unknown sources" on your phone and install
```

---

## Documentation

| File                      | Contents                            |
|---------------------------|-------------------------------------|
| docs/ARCHITECTURE.md      | System design, layers, data flow    |
| docs/DATABASE_SCHEMA.md   | All tables, relationships, indexes  |
| docs/API_SPEC.md          | All API endpoints with examples     |
| docs/LEARNING_NOTES.md    | React Native concepts for web devs  |
| docs/DEV_NOTES.md         | Setup guides, conventions           |
| docs/FEATURE_LOG.md       | What's built, what's planned        |
| docs/CHANGELOG.md         | Version history                     |

---

## Phase 1 Status

- [x] System architecture
- [x] Database schema (all modules)
- [x] SQL migrations (001, 002, 003)
- [x] Golang backend skeleton
- [x] User CRUD API
- [x] Quotes API
- [x] Period tracker API
- [x] React Native scaffold (Expo)
- [x] Theme system (colors, typography, spacing)
- [x] Navigation (Root Stack → Drawer → Bottom Tabs)
- [x] Splash screen with animated quote
- [x] 4-step onboarding flow
- [x] Period tracker with calendar UI
- [x] Reusable UI components (Button, Input, ScreenWrapper)
- [x] Global state (AppContext)
- [x] API service layer

---

## Color Palette

```
#36213E  ← Deep Purple   (background)
#554971  ← Mid Purple    (card surfaces)
#63768D  ← Slate Blue    (borders, muted text)
#8AC6D0  ← Sky Blue      (accents, icons)
#B8F3FF  ← Crystal Blue  (primary text, highlights)
```

---

## App Personality

Flirty. Witty. Slightly funny. Friendly. Always in your corner.
