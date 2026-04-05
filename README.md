# FinanceOS — Finance Dashboard

A full-stack finance management system with role-based access control, financial records management, and analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh tokens with rotation) |
| **Frontend** | Next.js 14, React, TypeScript |
| **Charts** | Recharts |
| **Validation** | Zod (shared schemas across FE + BE) |
| **API Docs** | Swagger UI |
| **Monorepo** | pnpm workspaces |

## Project Structure

```
finance-dashboard/
├── apps/
│   ├── api/          # Express REST API (Port 4000)
│   └── web/          # Next.js dashboard (Port 3000)
├── packages/
│   └── shared/       # Zod schemas + TypeScript types
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 16 (local or Docker)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cd apps/api
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

Default `.env` values (if using local PostgreSQL as set up):
```
DATABASE_URL="postgresql://finance_user:finance_pass@localhost:5432/finance_db"
```

### 3. Set Up Database
```bash
# Create DB user and database (one-time)
psql postgres -c "CREATE USER finance_user WITH PASSWORD 'finance_pass' CREATEDB;"
psql postgres -c "CREATE DATABASE finance_db OWNER finance_user;"

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 4. Run the Application

**Terminal 1 — API:**
```bash
pnpm dev:api
```
API runs at: http://localhost:4000
Swagger docs: http://localhost:4000/api/docs

**Terminal 2 — Web:**
```bash
pnpm dev:web
```
Dashboard at: http://localhost:3000

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@finance.local | Admin@123 |
| Analyst | analyst@finance.local | Analyst@123 |
| Viewer | viewer@finance.local | Viewer@123 |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login → returns JWT pair
- `POST /api/auth/refresh` — Rotate refresh token
- `POST /api/auth/logout` — Revoke refresh token
- `GET /api/auth/me` — Current user

### Users (Admin)
- `GET /api/users` — List paginated
- `POST /api/users` — Create
- `GET /api/users/:id` — Get by ID
- `PATCH /api/users/:id` — Update role/status
- `DELETE /api/users/:id` — Deactivate

### Records
- `GET /api/records` — List with filters + pagination
- `POST /api/records` — Create (Analyst+)
- `GET /api/records/:id` — Get by ID
- `PATCH /api/records/:id` — Update (Analyst+)
- `DELETE /api/records/:id` — Soft delete (Admin)

### Dashboard
- `GET /api/dashboard/summary` — Totals + savings rate
- `GET /api/dashboard/by-category` — Category breakdown
- `GET /api/dashboard/trends?year=2024` — Monthly trends
- `GET /api/dashboard/recent` — Recent transactions
- `GET /api/dashboard/insights` — Analyst insights (Analyst+)
- `GET /api/dashboard/audit-logs` — Audit trail (Admin)

### Health
- `GET /api/health` — Server status
- `GET /api/docs` — Swagger UI

## Role Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records & dashboard | ✅ | ✅ | ✅ |
| View analytics/insights | ❌ | ✅ | ✅ |
| Create/update records | ❌ | ✅ | ✅ |
| Soft delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

## Architecture Decisions

- **Soft delete** on records — financial data should never be hard deleted
- **Refresh token rotation** — prevents token reuse attacks
- **DB-level auth check** in middleware — tokens are invalidated the moment a user is deactivated
- **SQL aggregations** for dashboard — GROUP BY and date_trunc done in the DB, not JavaScript
- **Shared Zod schemas** — validation is defined once, used in both frontend and backend
- **Audit log** — every CREATE/UPDATE/DELETE/LOGIN/LOGOUT is persisted with actor and IP

