# RealmOs — Command Reference

All commands assume you are at the **root** of the RealmOs project unless stated otherwise.
The database (PostgreSQL) runs on AWS EC2. The backend and mobile app run locally.

---

## 1. Prerequisites

Make sure the following are installed before running anything:

| Tool | Version | Install |
|------|---------|---------|
| Go | 1.22+ | https://go.dev/dl |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI (builds only) | latest | `npm install -g eas-cli` |

---

## 2. Backend

### Setup — copy env file (first time only)
The `.env` file is already present at `backend/.env`. It is git-ignored.
```
# backend/.env contains:
PORT=8080
DB_HOST=13.127.71.96
DB_PORT=5432
DB_USER=realmos_user
DB_PASSWORD=<password>
DB_NAME=realmos
DB_SSLMODE=disable
ENV=development
JWT_SECRET=<secret>
```

### Run the backend server (development)
```bash
cd backend
go run cmd/server/main.go
```
The server starts at **http://localhost:8080**
Health check: http://localhost:8080/health

### Run database migrations
Runs all pending SQL migrations against the EC2 PostgreSQL database.
No `psql` installation required — uses the Go pgx driver directly.
```bash
cd backend && go run cmd/migrate/main.go
```

### Build the backend binary
```bash
cd backend && go build -o realmos-server ./cmd/server
./realmos-server
```

### Run Go tests
```bash
cd backend
go test ./...
```

### Tidy Go modules (after adding/removing dependencies)
```bash
cd backend
go mod tidy
```

---

## 3. Mobile (React Native + Expo)

### Install dependencies (first time or after pulling changes)
```bash
cd mobile
npm install
```

### Start the Expo dev server
```bash
cd mobile && npm start
# or equivalently:
npx expo start
```
Then press:
- `a` — open on Android emulator
- `i` — open on iOS simulator
- `w` — open in browser (limited)
- Scan the QR code with **Expo Go** app on your phone

> **Important:** When running on a physical device or emulator, update `mobile/src/services/api.ts`
> to point to your machine's local IP instead of the EC2 IP:
> ```ts
> const API_BASE_URL = 'http://YOUR_LOCAL_IP:8080/api/v1';
> ```
> Find your local IP: run `ipconfig` in Command Prompt → IPv4 Address under Wi-Fi adapter.

### Start on Android only
```bash
cd mobile
npm run android
```

### Start on iOS only
```bash
cd mobile
npm run ios
```

### Clear Expo cache (when things look broken)
```bash
cd mobile
npx expo start --clear
```

### Check for TypeScript errors
```bash
cd mobile
npx tsc --noEmit
```

---

## 4. Building the Android APK / AAB

Requires an Expo account and EAS setup. Run once:
```bash
eas login
eas build:configure
```

### Build a preview APK (shareable .apk)
```bash
cd mobile
npm run build:android
# or:
eas build --platform android --profile preview
```

### Build a production AAB (for Google Play Store)
```bash
cd mobile
npm run build:android:prod
# or:
eas build --platform android --profile production
```

---

## 5. Database

The PostgreSQL database runs on **AWS EC2 at 13.127.71.96:5432**.

### Run all migrations (from scratch or incrementally)
```bash
cd backend
go run cmd/migrate/main.go
```
Migrations are in `database/migrations/` and run in alphabetical order (001, 002, ...).

### Connect to the database manually (if psql is installed)
```bash
psql -h 13.127.71.96 -p 5432 -U realmos_user -d realmos
```

---

## 6. Typical Dev Workflow

```bash
# Terminal 1 — backend
cd backend
go run cmd/server/main.go

# Terminal 2 — mobile
cd mobile
npm start
```

Then open Expo Go on your phone and scan the QR code.
Make sure `mobile/src/services/api.ts` points to your local machine's IP on port 8080.
