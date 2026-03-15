# RealmOs – Developer Notes

## Environment Setup

### Prerequisites

| Tool          | Version    | Install                              |
|---------------|------------|--------------------------------------|
| Node.js       | 20+        | https://nodejs.org                   |
| Go            | 1.22+      | https://go.dev/dl                    |
| PostgreSQL    | 15+        | On EC2 (see below)                   |
| Expo CLI      | latest     | `npm install -g expo-cli`            |
| EAS CLI       | latest     | `npm install -g eas-cli`             |

---

## Local Development

### Start Backend

```bash
cd backend
cp .env.example .env       # fill in DB credentials
go run cmd/server/main.go
```

### Start Mobile

```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## EC2 PostgreSQL Setup

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2_IP>

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE realmos;
CREATE USER realmos_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE realmos TO realmos_user;
\q

# Allow remote connections (edit pg_hba.conf and postgresql.conf)
# postgresql.conf: listen_addresses = '*'
# pg_hba.conf: add line: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

---

## Running Migrations

```bash
cd backend
go run cmd/migrate/main.go up
```

Or run SQL directly:
```bash
psql -h <EC2_IP> -U realmos_user -d realmos -f database/migrations/001_init.sql
```

---

## Building APK for Android

```bash
cd mobile
eas login
eas build:configure     # first time only

# Build APK (not AAB) for direct install
eas build --platform android --profile preview
```

This generates a downloadable `.apk` URL. Install on your phone by:
1. Enable "Install from unknown sources" in Android settings
2. Download and open the APK

---

## Environment Variables

### Backend `.env`

```env
PORT=8080
DB_HOST=<EC2_IP>
DB_PORT=5432
DB_USER=realmos_user
DB_PASSWORD=your_secure_password
DB_NAME=realmos
DB_SSLMODE=disable
ENV=development
```

### Mobile `src/config.ts`

```ts
export const API_BASE_URL = 'http://<EC2_IP>:8080/api/v1';
```

---

## Git Workflow

- `main` branch = production-ready
- `master` branch = active development (current)
- Feature branches: `feature/period-tracker`, `feature/sleep-tracker`, etc.

---

## Folder Naming Conventions

- Files: `camelCase.ts`, `PascalCase.tsx` for components
- Folders: `kebab-case/` or `camelCase/`
- Constants: `UPPER_SNAKE_CASE`
- Types: `PascalCase`

---

## Common Pitfalls

1. **Expo Go vs Production** — some native modules don't work in Expo Go,
   they need a full build. Plan to test critical features with actual APK.

2. **EC2 t2.micro** — it's small. Don't run heavy queries. Add indexes early.

3. **CORS** — backend must allow requests from mobile app IP. Set CORS to `*`
   during development, restrict in production.

4. **Timezone** — always store UTC in database. Convert to user's local time
   on the frontend.

5. **UUID generation** — use `gen_random_uuid()` in PostgreSQL (requires
   `pgcrypto` extension or PostgreSQL 13+).
