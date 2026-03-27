# Fasossira

A full **multi-tenant SaaS platform** for inter-city transport companies — built with **NestJS**, **Angular 18**, and **PostgreSQL**. Fasossira digitalises the entire operation of a transport company: route and fleet management, trip scheduling, seat reservations, payments, and ticketing.

The platform has three separate applications:

- **API** — NestJS backend
- **Web** — Angular admin panel for company admins and agents
- **Portal** — public-facing Angular web app for passengers to search routes and book tickets online

> Designed for the West African market with local constraints in mind: en-route boarding, segment-based pricing, and multi-agency operations.

## Architecture

```
fasossira/
├── apps/
│   ├── api/        # NestJS REST API (port 3000)
│   ├── web/        # Angular admin panel (port 4200)
│   └── portal/     # Angular public booking portal (port 4201)
└── libs/
    └── shared-types/   # Shared TypeScript models and DTOs
```

## Tech stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Backend        | NestJS 10 + TypeScript                           |
| Admin frontend | Angular 18 (standalone components, NgRx Signals) |
| Public portal  | Angular 18 (standalone components)               |
| Database       | PostgreSQL via TypeORM                           |
| Auth           | JWT (access + refresh tokens) with role guards   |
| Docs           | Swagger UI (`/api/docs`)                         |
| Rate limiting  | @nestjs/throttler (100 req/min global)           |
| Container      | Docker + Docker Compose                          |

## Multi-tenant architecture

Every company (tenant) has its data fully isolated by `companyId`. One Fasossira instance serves multiple transport companies simultaneously — each with their own users, routes, buses, trips, and agents.

## Roles

| Role              | Scope           | Permissions                                                             |
| ----------------- | --------------- | ----------------------------------------------------------------------- |
| **Super Admin**   | Platform-wide   | Manage companies, assign subscription plans, view SaaS revenue          |
| **Company Admin** | Own tenant only | Configure company, manage users / buses / routes / agencies, plan trips |
| **Agent**         | Own agency only | Sell tickets at counter, en-route boarding, check seat availability     |
| **Client**        | Public portal   | Search routes by company, reserve seats, pay, receive tickets           |

## Domain modules (12+)

| Module               | Responsibility                                                                    |
| -------------------- | --------------------------------------------------------------------------------- |
| `AuthModule`         | JWT login, refresh, role guards, decorators                                       |
| `CompaniesModule`    | Tenant management, company settings                                               |
| `PlansModule`        | Subscription plans (Starter / Pro / Enterprise)                                   |
| `AgenciesModule`     | Agency CRUD, per-company                                                          |
| `UsersModule`        | User management per tenant                                                        |
| `BusesModule`        | Fleet management                                                                  |
| `RoutesModule`       | Route definitions, stops, segment prices                                          |
| `TripsModule`        | Trip instances (route + bus + schedule)                                           |
| `SchedulesModule`    | Recurring schedule management                                                     |
| `ReservationsModule` | Seat reservations                                                                 |
| `PaymentsModule`     | Payment records                                                                   |
| `TicketsModule`      | Ticket generation and validation                                                  |
| `DashboardModule`    | Analytics and KPI reporting                                                       |
| `PublicModule` le`   | Analytics and KPI reporting                                                       |
| `PublicModule`       | Public endpoints for the passenger portal (route search, availability by company) |

## Project structure

```
fasossira/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── app.module.ts        # Root module — DB, throttler, global guards
│   │       ├── auth/                # JWT strategy, guards, decorators
│   │       ├── companies/           # Multi-tenant company management
│   │       ├── plans/               # Subscription plans
│   │       ├── agencies/            # Agency CRUD
│   │       ├── users/               # User management per tenant
│   │       ├── buses/               # Fleet
│   │       ├── routes/              # Routes, stops, segment prices
│   │       ├── trips/               # Trip instances
│   │       ├── schedules/           # Schedules
│   │       ├── reservations/        # Reservations
│   │       ├── payments/            # Payments
│   │       ├── tickets/             # Ticketing
│   │       ├── dashboard/           # Analytics
│   │       └── public/              # Public endpoints for the portal
│   │
│   ├── web/                         # Admin panel (Company Admin + Agent)
│   │   └── src/app/
│   │       ├── core/
│   │       │   ├── auth/            # Auth store (NgRx Signals), auth service
│   │       │   ├── guards/          # Auth guard, role guard
│   │       │   └── interceptors/    # JWT + error interceptors
│   │       └── features/
│   │           ├── auth/            # Login page
│   │           ├── admin/           # Company Admin dashboard
│   │           ├── agent/           # Agent ticket office
│   │           └── super-admin/     # Super Admin panel
│   │
│   └── portal/                      # Public passenger booking app
│       └── src/app/
│           ├── core/
│           │   ├── services/
│           │   │   ├── public-search.service.ts   # Route search, filtered by company
│           │   │   └── booking-state.service.ts   # Multi-step booking state
│           │   └── interceptors/
│           │       └── portal.interceptor.ts
│           └── features/
│               ├── search/          # Search page — filter trips by company, origin, date
│               ├── booking/         # Seat selection and passenger details
│               ├── confirmation/    # Booking confirmation summary
│               └── my-ticket/       # View and download ticket
│
└── libs/
    └── shared-types/                # Shared TypeScript models and DTOs
```

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)

### 1. Clone and install

```bash
git clone https://github.com/TechSingou/fasossira.git
cd fasossira
docker compose up -d postgres
```

Install dependencies for each app independently:

```bash
cd apps/api && npm install
$env:SEED_DEMO=true; npx ts-node src/seed.ts

cd ../web && npm install
cd ../portal && npm install
```

### 2. Configure environment

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=fasossira
DB_PASS=fasossira_dev
DB_NAME=fasossira
JWT_ACCESS_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
```

---

## Running the apps

Each app runs independently. Open three terminals:

### API (NestJS)

```bash
cd apps/api
npm run start:dev
# http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### Web — Admin panel (Angular)

```bash
cd apps/web
npm start
# http://localhost:4200
```

### Portal — Public booking app (Angular)

```bash
cd apps/portal
npm start
# http://localhost:4201
```

---

## Authentication flow

```
POST /api/v1/auth/login     →  200 { accessToken, refreshToken }

# Use access token on protected routes:
Authorization: Bearer <accessToken>

# Refresh when access token expires:
POST /api/v1/auth/refresh
Authorization: Bearer <refreshToken>
→  200 { accessToken, refreshToken }   (old token is revoked)
```

## Public portal flow (no auth required)

```
GET /api/v1/public/companies          →  List of transport companies
GET /api/v1/public/trips?companyId=&origin=&destination=&date=
                                      →  Available trips for that company
POST /api/v1/public/reservations      →  Create a reservation
GET /api/v1/public/tickets/:ref       →  Retrieve ticket by reference
```

---

## Key design decisions

- **Multi-tenancy via `companyId`** — all business entities are scoped to a company; no data leaks between tenants
- **Subscription plans with limits** — each plan defines max buses, agents, and agencies
- **Segment-based pricing** — fares vary by boarding and alighting stop, not just origin/destination
- **En-route boarding** — agents can add passengers mid-journey, a common practice in the target market
- **Company-filtered public search** — the portal lets passengers filter trips by transport company, giving each operator a branded experience within the shared platform
- **Role decorators** — `@Roles()`, `@CurrentUser()`, `@TenantScope()`, `@Public()` for clean, declarative access control

---

## Author

**Singou Dembele** — [GitHub](https://github.com/TechSingou) · [LinkedIn](https://www.linkedin.com/in/singou-k-dembele/)
