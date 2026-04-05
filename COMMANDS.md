# FinanceOS — Commands Reference

All commands to be run from the **project root** unless noted otherwise.

---

## 1. Prerequisites (one-time setup)

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Ensure PostgreSQL is running (macOS with Homebrew)
brew services start postgresql@16
```

---

## 2. First-time Setup

```bash
# Step 1 — Install all dependencies (frontend + backend + shared)
pnpm install

# Step 2 — Create the PostgreSQL database and user (run only once)
psql postgres -c "CREATE USER finance_user WITH PASSWORD 'finance_pass' CREATEDB;"
psql postgres -c "CREATE DATABASE finance_db OWNER finance_user;"

# Step 3 — Run database migrations (creates all tables)
pnpm db:migrate

# Step 4 — Seed demo data (creates users + 30 sample records)
pnpm db:seed
```

---

## 3. Running the Application

Open **two separate terminals** — one for each service.

### Terminal 1 — Backend API (port 4000)
```bash
pnpm dev:api
```
- API base: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs
- Health check: http://localhost:4000/api/health

### Terminal 2 — Frontend Dashboard (port 3000)
```bash
pnpm dev:web
```
- Dashboard: http://localhost:3000

---

## 4. Demo Login Credentials

| Role     | Email                    | Password     | Allowed Actions                            |
|----------|--------------------------|--------------|---------------------------------------------|
| Admin    | admin@finance.local      | Admin@123    | Everything — users, records, audit logs     |
| Analyst  | analyst@finance.local    | Analyst@123  | Create/update records, view analytics       |
| Viewer   | viewer@finance.local     | Viewer@123   | Read-only access to records and dashboard   |

---

## 5. Database Commands

```bash
# Run pending migrations
pnpm db:migrate

# Re-seed demo data (clears existing data first)
pnpm db:seed

# Reset database completely (drops all tables and re-migrates)
pnpm --filter api db:reset

# Open Prisma Studio (GUI for the database)
pnpm db:studio

# Regenerate Prisma client after schema changes
pnpm --filter api generate
```

---

## 6. Build Commands (Production)

```bash
# Build both API and frontend
pnpm build:api
pnpm build:web

# Start the compiled API (after build)
pnpm --filter api start
```

---

## 7. Type Checking

```bash
# Check API TypeScript errors
pnpm --filter api typecheck

# Check Next.js TypeScript errors
pnpm --filter web build
```

---

## 8. Useful API Tests (curl)

```bash
# Health check
curl http://localhost:4000/api/health

# Login (returns JWT tokens)
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"Admin@123"}'

# Get records (replace TOKEN with accessToken from login)
curl http://localhost:4000/api/records \
  -H "Authorization: Bearer TOKEN"

# Get dashboard summary
curl http://localhost:4000/api/dashboard/summary \
  -H "Authorization: Bearer TOKEN"

# Get monthly trends for 2024
curl "http://localhost:4000/api/dashboard/trends?year=2024" \
  -H "Authorization: Bearer TOKEN"
```

---

## 9. Troubleshooting

**"MODULE_NOT_FOUND" error in Next.js dev server:**
```bash
cd apps/web && rm -rf .next && cd ../.. && pnpm dev:web
```

**Database connection error:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
brew services start postgresql@16

# Check if finance_db exists
psql postgres -c "\l" | grep finance_db
```

**Port already in use:**
```bash
# Kill whatever is on port 4000
lsof -ti:4000 | xargs kill -9

# Kill whatever is on port 3000
lsof -ti:3000 | xargs kill -9
```

**Re-run migrations after a schema change:**
```bash
pnpm db:migrate
pnpm --filter api generate
```

---

## 10. Project Structure

```
finance-dashboard/
├── apps/
│   ├── api/                     # Express REST API
│   │   ├── src/
│   │   │   ├── config/          # Environment config + Swagger
│   │   │   ├── controllers/     # Route handlers (thin layer)
│   │   │   ├── database/        # Prisma client + seed script
│   │   │   ├── middleware/      # Auth, RBAC, validation, error handling
│   │   │   ├── routes/          # Express routers
│   │   │   ├── services/        # Business logic layer
│   │   │   ├── types/           # Shared Express types (req.user)
│   │   │   ├── utils/           # JWT, password, response helpers
│   │   │   ├── app.ts           # Express app setup
│   │   │   └── server.ts        # Server bootstrap + graceful shutdown
│   │   └── prisma/
│   │       ├── schema.prisma    # DB schema (User, Record, RefreshToken, AuditLog)
│   │       └── migrations/      # Auto-generated migration SQL files
│   └── web/                     # Next.js 14 frontend
│       └── src/
│           ├── app/             # App Router pages
│           │   ├── (dashboard)/ # Protected pages (require auth)
│           │   │   ├── dashboard/   # Overview with charts
│           │   │   ├── records/     # List + create/edit/delete records
│           │   │   ├── analytics/   # Category breakdown + insights
│           │   │   ├── users/       # User management (Admin only)
│           │   │   └── audit/       # Audit log viewer (Admin only)
│           │   ├── login/       # Login page
│           │   └── layout.tsx   # Root layout + AuthProvider
│           ├── components/      # RecordModal, UserModal, Sidebar
│           ├── context/         # AuthContext (login/logout state)
│           └── lib/             # API client (typed fetch wrappers)
└── packages/
    └── shared/                  # Zod schemas shared by API + frontend
        └── src/index.ts
```
