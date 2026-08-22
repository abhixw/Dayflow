# Dayflow — HRMS Backend

*Every workday, perfectly aligned.*

An HRMS (Human Resource Management System) backend built incrementally. This
README covers what exists today.

## Status

- **MVP Phases 1–7 (Auth, Employee Profile, Attendance, Leave, Admin/HR
  Employee Management, Leave Approval, Payroll): done**, 56/56 backend tests
  passing.
- **Cookie-based authentication: done** — replaces the original
  `Authorization: Bearer` header scheme.
- **Notifications (in-app + email): done** — leave submit/approve/reject and
  payroll updates trigger both.
- **Analytics (employee + admin/HR): done** — SQL-aggregated, no new tables.
- Full test suite: `pytest` — 56 tests, all green (run time is long, ~40 min,
  entirely Neon connection round-trip latency per test, not app logic — see
  Testing below).

## Tech Stack

- Python 3.12+
- FastAPI
- PostgreSQL, hosted on [Neon](https://neon.tech)
- SQLAlchemy 2.x (async ORM, via `asyncpg`)
- Alembic (migrations)
- Pydantic v2
- JWT (PyJWT), HttpOnly cookie transport
- Argon2 (password hashing)
- stdlib `smtplib` (email — no extra dependency)
- Uvicorn
- pytest + httpx (async API tests)

## Architecture

```
Frontend
   ↓
FastAPI REST API   (app/routers)
   ↓
Service Layer      (app/services)
   ↓
SQLAlchemy ORM      (app/models)
   ↓
PostgreSQL (Neon)
```

Route handlers stay thin — request/response only. Business logic lives in
`app/services/*`. Routers translate service-layer exceptions into HTTP status
codes. All API schemas inherit `CamelModel` (`app/schemas/base.py`), which
accepts snake_case **or** camelCase on input and always serializes camelCase
on output — the frontend gets a pure camelCase JSON contract while internal
Python code stays idiomatic snake_case.

```
backend/
├── app/
│   ├── main.py                 FastAPI app, CORS, router registration
│   ├── core/
│   │   ├── config.py            Settings (env-var driven: DB, JWT, cookie, SMTP)
│   │   ├── security.py          Password hashing, JWT encode/decode
│   │   ├── dependencies.py      get_current_user (reads the cookie), require_* role guards
│   │   └── exceptions.py        Domain exceptions (mapped to HTTP in routers)
│   ├── db/
│   │   ├── database.py          Async engine (NullPool), session factory, get_db dep
│   │   └── base.py              Declarative Base
│   ├── models/                  SQLAlchemy ORM models
│   ├── schemas/                 Pydantic request/response models (CamelModel-based)
│   ├── routers/                 FastAPI routers (thin)
│   └── services/                Business logic, incl. notification_service.py, email_service.py
├── alembic/                     Migrations
├── tests/                       pytest + httpx tests (run against an isolated DB)
└── scripts/
    └── seed.py                  Seeds 1 ADMIN, 1 HR, 3 EMPLOYEE accounts
```

## Database Design

```
User (users)
 └── Employee (employees)     1:1, via employees.user_id → users.id
      ├── Attendance          attendance.employee_id → employees.id
      ├── Leave (leaves)      leaves.employee_id → employees.id, leaves.reviewer_id → users.id
      ├── Payroll             payroll.employee_id → employees.id (unique), payroll.updated_by → users.id
      └── Notification        notifications.user_id → users.id (auth-level, not employee-level)
```

**`users`** — authentication only.

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | string, unique | e.g. `EMP001`; same column for every role, including HR/Admin |
| email | string, unique | |
| password_hash | string | Argon2, never returned by the API |
| role | enum(`EMPLOYEE`,`HR`,`ADMIN`) | |
| is_verified | bool | email-verification architecture; no email sending for verification yet |
| is_active | bool | drives the employee-facing `status: "ACTIVE"/"INACTIVE"` |
| verification_token | string, nullable | issued at signup |
| created_at / updated_at | timestamptz | |

**`employees`** — profile data, no auth material.

| column | type | notes |
|---|---|---|
| id | UUID, PK | internal only — never used as an API path parameter (see below) |
| user_id | UUID, FK → users.id, unique | 1:1 with users |
| employee_id | string, unique | the human-readable code; **this** is what `{employee_id}` path params mean everywhere |
| first_name / last_name | string, nullable | not required at signup; combined into `name` in API responses |
| phone / address / profile_picture | string, nullable | employee-editable |
| job_title / department | string, nullable | HR/Admin-editable only |
| joining_date | date, nullable | HR/Admin-editable only |
| documents | JSONB, default `[]` | see ASSUMPTION below |
| created_at / updated_at | timestamptz | |

**ASSUMPTION — `documents` representation:** JSONB array of objects (e.g.
`{"name": ..., "url": ...}`), not a separate table. No file upload endpoint
exists — out of MVP scope.

**ASSUMPTION — `{employee_id}` path parameter, resolved:** every
`{employee_id}` path parameter across `/api/employees`, `/api/attendance`,
and `/api/payroll` is the **human-readable `employees.employee_id` code**
(e.g. `EMP001`), not the internal UUID. This was confirmed against the
frontend's actual usage (it never handles an employee UUID at all — it keys
everything, including cross-referencing attendance/leave records back to
employees, by this code).

**`attendance`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, indexed | |
| date | date | |
| check_in / check_out | timestamptz, nullable | `check_out` null until checkout |
| status | enum(`PRESENT`,`ABSENT`,`HALF_DAY`,`LEAVE`) | set to `PRESENT` on check-in; no automatic attendance-policy engine |
| created_at / updated_at | timestamptz | |

**`leaves`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, indexed | |
| leave_type | enum(`PAID`,`SICK`,`UNPAID`) | |
| start_date / end_date | date | `end_date >= start_date` enforced by the request schema |
| remarks | string, nullable | |
| status | enum(`PENDING`,`APPROVED`,`REJECTED`), indexed | only a `PENDING` leave can be approved/rejected |
| reviewer_id | UUID, FK → users.id, nullable | set on approve/reject |
| review_comment | string, nullable | |
| reviewed_at | timestamptz, nullable | |
| created_at / updated_at | timestamptz | |

Overlap handling: a new request is rejected (409) if its date range overlaps
any of that employee's existing `PENDING`/`APPROVED` leaves. No leave-balance
tracking (not specified for the MVP).

**`payroll`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, unique | one payroll row per employee |
| basic_salary / allowances / deductions / gross_salary / net_salary | numeric(12,2) in DB, `float` on the wire | independently HR/Admin-settable — **no automatic calculation** |
| updated_by | UUID, FK → users.id, nullable | last HR/Admin who wrote to this row |
| created_at / updated_at | timestamptz | |

`PATCH /api/payroll/{employee_id}` upserts. **Money fields are `float` in the
API schema, not `Decimal`** — Pydantic serializes `Decimal` to a JSON string
by default, which would silently violate the frontend's `number` type
contract; the DB column stays `Decimal`/`Numeric` for storage precision, the
API boundary casts to `float`.

**`notifications`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users.id, indexed | not employee-scoped — HR/Admin get these too |
| type | enum(`LEAVE_SUBMITTED`,`LEAVE_APPROVED`,`LEAVE_REJECTED`,`PAYROLL_UPDATED`,`ATTENDANCE_ALERT`,`PROFILE_UPDATED`,`SYSTEM`) | `ATTENDANCE_ALERT`/`PROFILE_UPDATED`/`SYSTEM` exist in the enum but nothing currently emits them |
| title / message | string | |
| is_read | bool, default false | |
| created_at | timestamptz | no `updated_at` — matches the spec's exact field list |

## Indexes / Constraints

- `users.email` — unique · `users.employee_id` — unique
- `employees.user_id` — unique (1:1) · `employees.employee_id` — unique
- `attendance(employee_id, date)` — unique · `attendance.employee_id` — indexed
- `leaves.employee_id` — indexed · `leaves.status` — indexed
- `payroll.employee_id` — unique
- `notifications.user_id` — indexed

## Environment Variables

| var | purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string, `postgresql+asyncpg://...` |
| `TEST_DATABASE_URL` | **Separate** database used only by `pytest` — never the dev DB |
| `JWT_SECRET_KEY` | HMAC signing key, ≥32 bytes |
| `JWT_ALGORITHM` | default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | default `60` — also the cookie's `max-age` |
| `CORS_ORIGINS` | comma-separated allowed origins, no `*` with credentials |
| `COOKIE_SECURE` | default `false`; set `true` behind HTTPS in production |
| `COOKIE_SAMESITE` | default `lax` — works across localhost ports in dev |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM_EMAIL` | optional — if `SMTP_HOST` is unset, email sending is skipped and logged instead, so the app works fully without SMTP configured |

`.env` holds real values (gitignored). `.env.example` holds placeholders only.

**Why a separate `TEST_DATABASE_URL`:** the test suite truncates its tables
between every test. `tests/conftest.py` refuses to start if it isn't set.

## Local Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in real values
```

### Neon database setup

1. Create a Neon project; use its pooled connection string for `DATABASE_URL`.
2. Create a second database in the **same** project for tests:
   ```sql
   CREATE DATABASE dayflow_test;
   ```
   Point `TEST_DATABASE_URL` at it.
3. Apply migrations to both:
   ```bash
   alembic upgrade head
   ALEMBIC_DATABASE_URL="$TEST_DATABASE_URL" alembic upgrade head
   ```

### Run the server

```bash
uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs

### Run with Docker (backend + frontend together)

```bash
docker compose up --build
```

- Backend: http://localhost:8000 (migrates on every start, then `--reload`)
- Frontend: http://localhost:5175 (Vite dev server; container's internal port
  stays `5173`, only the host mapping moved to avoid clashing with another
  local project already on `5173` — keep `CORS_ORIGINS` in sync if you change it)

If you add a frontend dependency (`npm install <pkg>` on the host), a plain
`docker compose build frontend` is **not enough** — Compose reuses the
anonymous `node_modules` volume across recreates, so the container keeps
serving the old `node_modules` until you force a fresh one:
```bash
docker compose up -d --force-recreate --renew-anon-volumes frontend
```

### Seed data

```bash
python -m scripts.seed
```

| email | role | password |
|---|---|---|
| admin@dayflow.dev | ADMIN | AdminPass123! |
| hr@dayflow.dev | HR | HrPass123! |
| employee1@dayflow.dev | EMPLOYEE | EmpPass123! |
| employee2@dayflow.dev | EMPLOYEE | EmpPass123! |
| employee3@dayflow.dev | EMPLOYEE | EmpPass123! |

Idempotent — safe to re-run. This is the **only** way to create an ADMIN
account; public signup rejects `role=ADMIN`.

### Run tests

```bash
pytest
```

Runs against `TEST_DATABASE_URL` via a FastAPI dependency override, never the
dev database. 56 tests, ~40 minutes — the time is Neon's per-connection TLS
handshake latency multiplied across many sequential requests (the app uses
`NullPool`, a fresh connection per request, deliberately — see the
Testing/Performance note below), not app-level slowness.

## Authentication — HttpOnly cookie

```
POST /api/auth/login
   ↓ validate credentials
   ↓ generate JWT
   ↓ Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600
   ↓ response body: the user only — no token in JSON, ever
Browser stores the cookie; sends it automatically on every same-origin request
FastAPI reads request.cookies["access_token"] in get_current_user
```

- `POST /api/auth/signup` — `role` restricted to `EMPLOYEE`/`HR`; accepts an
  **optional** `name` field (split into `first_name`/`last_name`) so an
  employee can set their name at signup instead of waiting for HR to fill it
  in later — not part of the MVP's literal 4-field signup list, but additive
  and harmless if omitted.
- `POST /api/auth/login` — sets the cookie, returns the user.
- `GET /api/auth/me` — current user from the cookie; the frontend's only way
  to know if a session exists (no client-side token to inspect).
- `POST /api/auth/logout` — clears the cookie (`Max-Age=0`).

`get_current_user`/`require_employee`/`require_hr`/`require_admin`/
`require_hr_or_admin` are unchanged in shape — only the token *source*
changed, from `Authorization: Bearer` to the cookie.

CORS is `allow_credentials=True` with an explicit origin list (never `"*"`
with credentials) — required for cookies to work cross-port in dev.

## Notifications

`app/services/notification_service.py` — `create_notification(db, user_id,
type, title, message)`, `get_notifications`, `get_unread_count`, `mark_read`,
`mark_all_read`. Business services call this directly; routers never create
notifications themselves.

| method | path | notes |
|---|---|---|
| GET | `/api/notifications` | `{items, unreadCount}`, own notifications only, newest first |
| GET | `/api/notifications/unread-count` | `{unreadCount}` |
| PATCH | `/api/notifications/{notification_id}/read` | 404 if it isn't yours (never a 403 — doesn't confirm existence) |
| PATCH | `/api/notifications/read-all` | 204 |

Wired into:
- `leave_service.create_leave` → notifies **every** HR/ADMIN user (`LEAVE_SUBMITTED`)
- `leave_service._review_leave` → notifies the applicant (`LEAVE_APPROVED`/`LEAVE_REJECTED`)
- `payroll_service.upsert_payroll` → notifies the employee (`PAYROLL_UPDATED`)

Each of these also calls `email_service.send_email` right after the
in-app notification — same event, both channels, one call site (never
duplicated across routers). No email on attendance check-in/check-out, by design.

## Analytics

`app/services/analytics_service.py` — pure SQLAlchemy aggregation
(`func.count`/`sum`/`avg`, `case()`-based conditional counts, `group_by`) —
no Python-side loops over full tables, no new tables.

| method | path | auth | notes |
|---|---|---|---|
| GET | `/api/analytics/me?start_date&end_date` | any authenticated | own attendance/leave/payroll + a per-date attendance trend |
| GET | `/api/analytics/admin?start_date&end_date` | HR/ADMIN | org-wide equivalents + employee/department stats |

**Date filtering default:** omitting `start_date`/`end_date` returns
**all-time** data (no implicit window) — the simplest, most predictable
default; there's no hidden "last 30 days" truncation.

**Leave date filtering semantics:** filters on `leaves.start_date` (i.e.
"leave activity scheduled during this period"), not on `created_at`.

## Role/permission matrix

| dependency | allows | used by |
|---|---|---|
| `get_current_user` | any authenticated, active user | `/auth/*`, `/employees/me`, `/attendance/{check-in,check-out,me}`, `/leaves` (create/me/detail), `/payroll/me`, `/notifications/*`, `/analytics/me` |
| `require_hr_or_admin` | HR, ADMIN | `/employees` list/detail/update, `/attendance` list/detail, `/leaves` list/approve/reject, `/payroll` detail/update, `/analytics/admin` |
| `require_hr` / `require_admin` | HR only / ADMIN only | available; no HR-exclusive-of-ADMIN (or vice versa) action was specified, so unused |

Role is always read from the JWT/DB, never trusted from the request body.

## Full API list

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/employees/me
PATCH  /api/employees/me
GET    /api/employees
GET    /api/employees/{employee_id}
PATCH  /api/employees/{employee_id}

POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance/me
GET    /api/attendance
GET    /api/attendance/{employee_id}

POST   /api/leaves
GET    /api/leaves/me
GET    /api/leaves
GET    /api/leaves/{leave_id}
PATCH  /api/leaves/{leave_id}/approve
PATCH  /api/leaves/{leave_id}/reject

GET    /api/payroll/me
GET    /api/payroll/{employee_id}
PATCH  /api/payroll/{employee_id}

GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/{notification_id}/read
PATCH  /api/notifications/read-all

GET    /api/analytics/me
GET    /api/analytics/admin
```

## Testing

- `tests/test_auth.py` — signup (+ optional `name`), signup rejecting `ADMIN`,
  duplicate email/employee_id, login sets an HttpOnly cookie (never a token
  in the body), invalid credentials, missing/invalid/valid cookie, logout
  clears the cookie, `/me`.
- `tests/test_employees.py` — own-profile view/edit, restricted fields
  rejected, employee blocked from list/detail/deactivate, HR list/view/
  update/deactivate, 404 on unknown employee.
- `tests/test_attendance.py` — check-in, duplicate check-in, check-out,
  checkout-before-checkin, duplicate checkout, employee sees only own
  records, employee blocked from admin endpoints, HR sees all records.
- `tests/test_leaves.py` — apply, invalid date range, overlap rejected,
  own-leave view, cross-employee 404, HR view-any, employee blocked from
  list/approve, HR list/approve/reject, re-processing a decided leave
  rejected.
- `tests/test_payroll.py` — payroll-not-set 404, employee blocked from
  modifying, HR sets and employee reads it back, HR views/partial-updates.
- `tests/test_notifications.py` — notification created on leave submit,
  scoped to the owner only, cannot mark another user's notification read,
  mark one read, mark all read.
- `tests/test_analytics.py` — employee sees own analytics only, HR/Admin
  sees org-wide analytics, employee blocked (403) from `/analytics/admin`,
  calculations checked against known seeded records.

**All 56 tests pass.** Multi-identity tests (e.g. HR acting on an employee's
data) use a `client_factory` fixture instead of a single shared client —
necessary because cookie auth means one `httpx.AsyncClient`'s cookie jar can
only hold one identity's session at a time; each `client_factory()` call
returns an independent client with its own jar.

### A performance/timing note, since it's easy to mistake for a bug

Each test opens several fresh `NullPool` connections to Neon (signup, login,
the actual assertions, teardown truncate). Neon's per-connection TLS
handshake is the dominant cost, not app logic — a single API call completes
in well under 100ms once connected. If a test run appears to "hang," check
`pg_stat_activity` for a stray `idle in transaction` connection (this
happened repeatedly during development whenever a test process was killed
mid-run without a clean shutdown) before assuming a real bug:
```sql
SELECT pid, state, now() - query_start AS duration, query
FROM pg_stat_activity WHERE state = 'idle in transaction';
```
`SELECT pg_terminate_backend(<pid>)` clears it.

## MVP Limitations (current)

- Email verification has the necessary fields but nothing yet consumes the
  verification token (no `/api/auth/verify-email` endpoint).
- No token revocation/blocklist — logout is a cookie clear, not server-side
  invalidation of the JWT itself.
- No attendance-policy engine, no leave-balance tracking, tax calculation,
  payslip generation, or other items explicitly excluded from the MVP.
- Payroll's `gross_salary`/`net_salary` are stored values HR/Admin enters
  directly, never computed — by design.
- `NotificationType.ATTENDANCE_ALERT` and `PROFILE_UPDATED` exist in the
  enum (per spec) but nothing currently triggers them.

## Future Enhancements (explicitly out of scope for this MVP)

Push notifications, recruitment, performance management, tax calculation,
biometric/face-recognition attendance, AI features, chat, payment
processing, third-party HR integrations, payslip generation.
