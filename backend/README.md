# Dayflow — HRMS Backend

*Every workday, perfectly aligned.*

An HRMS (Human Resource Management System) backend built incrementally, phase
by phase. This README covers what exists today and is updated as each phase
lands.

## Status

- **Phase 1 — Authentication & Authorization: done**
- **Phase 2 — Employee Profile: done**
- **Phase 3 — Attendance: done**
- **Phase 4 — Leave Management: done**
- **Phase 5 — Admin/HR Employee Management: done** (fully covered by the
  `GET /api/employees` / `GET /api/employees/{employee_id}` endpoints already
  built in Phase 2 — no separate work needed)
- **Phase 6 — Admin/HR Attendance & Leave Approval: done** (attendance side
  was already covered by Phase 3's `GET /api/attendance` endpoints; this phase
  added leave approve/reject)
- **Phase 7 — Payroll: done**
- All code is implemented and the app boots/routes correctly (verified via
  the OpenAPI schema). **Full test-suite verification across all phases is
  still pending** — see Testing below.

## Tech Stack

- Python 3.12+
- FastAPI
- PostgreSQL, hosted on [Neon](https://neon.tech)
- SQLAlchemy 2.x (async ORM, via `asyncpg`)
- Alembic (migrations)
- Pydantic v2
- JWT (PyJWT) + Argon2 password hashing
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

Route handlers stay thin — request/response only. Business logic (duplicate
checks, password hashing, token creation) lives in `app/services/*`. Routers
translate service-layer exceptions into HTTP status codes.

```
backend/
├── app/
│   ├── main.py                 FastAPI app, CORS, router registration
│   ├── core/
│   │   ├── config.py            Settings (env-var driven)
│   │   ├── security.py          Password hashing, JWT encode/decode
│   │   ├── dependencies.py      get_current_user, require_* role guards
│   │   └── exceptions.py        Domain exceptions (mapped to HTTP in routers)
│   ├── db/
│   │   ├── database.py          Async engine, session factory, get_db dep
│   │   └── base.py              Declarative Base
│   ├── models/                  SQLAlchemy ORM models
│   ├── schemas/                 Pydantic request/response models
│   ├── routers/                 FastAPI routers (thin)
│   └── services/                Business logic
├── alembic/                     Migrations
├── tests/                       pytest + httpx tests (run against an isolated DB)
└── scripts/
    └── seed.py                  Seeds 1 ADMIN, 1 HR, 3 EMPLOYEE accounts
```

## Database Design

### Tables (all five exist)

```
User (users)
 └── Employee (employees)     1:1, via employees.user_id → users.id
      ├── Attendance          attendance.employee_id → employees.id
      ├── Leave (leaves)      leaves.employee_id → employees.id, leaves.reviewer_id → users.id
      └── Payroll             payroll.employee_id → employees.id (unique), payroll.updated_by → users.id
```

**`users`** — authentication only.

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | string, unique | e.g. `EMP001` |
| email | string, unique | |
| password_hash | string | Argon2, never returned by the API |
| role | enum(`EMPLOYEE`,`HR`,`ADMIN`) | |
| is_verified | bool | email-verification architecture; no email sending yet |
| is_active | bool | |
| verification_token | string, nullable | issued at signup |
| created_at / updated_at | timestamptz | |

**`employees`** — profile data, no auth material.

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users.id, unique | 1:1 with users |
| employee_id | string, unique | duplicated from `users.employee_id` for convenient joins/filters |
| first_name / last_name | string | |
| phone / address / profile_picture | string, nullable | employee-editable |
| job_title / department | string, nullable | HR/Admin-editable only |
| joining_date | date, nullable | HR/Admin-editable only |
| documents | JSONB, default `[]` | see note below |
| created_at / updated_at | timestamptz | |

**ASSUMPTION — `documents` representation:** the spec doesn't define a
document's shape. For the MVP this is a JSONB array of objects (e.g.
`{"name": ..., "url": ...}`), not a separate table. No file upload endpoint
exists yet — documents would be populated by a future upload flow that stores
files elsewhere (e.g. object storage) and records metadata here. A normalized
`documents` table can replace this later without touching other tables if
document management grows beyond simple metadata.

**`attendance`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, indexed | |
| date | date | |
| check_in / check_out | timestamptz, nullable | `check_out` null until checkout |
| status | enum(`PRESENT`,`ABSENT`,`HALF_DAY`,`LEAVE`) | set to `PRESENT` on check-in; no automatic attendance-policy engine (none was specified) |
| created_at / updated_at | timestamptz | |

**`leaves`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, indexed | |
| leave_type | enum(`PAID`,`SICK`,`UNPAID`) | |
| start_date / end_date | date | `end_date >= start_date` enforced by the request schema |
| remarks | string, nullable | |
| status | enum(`PENDING`,`APPROVED`,`REJECTED`), indexed | starts `PENDING`; only a `PENDING` leave can be approved/rejected |
| reviewer_id | UUID, FK → users.id, nullable | set on approve/reject |
| review_comment | string, nullable | |
| reviewed_at | timestamptz, nullable | |
| created_at / updated_at | timestamptz | |

Overlap handling: a new request is rejected (409) if its date range overlaps
any of that employee's existing `PENDING` or `APPROVED` leaves. No leave
balance tracking (not specified for the MVP).

**`payroll`**

| column | type | notes |
|---|---|---|
| id | UUID, PK | |
| employee_id | UUID, FK → employees.id, unique | one payroll row per employee |
| basic_salary / allowances / deductions / gross_salary / net_salary | numeric(12,2) | all five are independently HR/Admin-settable — **no automatic calculation** (gross/net are not derived from the other three; the spec explicitly excludes automated payroll processing) |
| updated_by | UUID, FK → users.id, nullable | last HR/Admin who wrote to this row |
| created_at / updated_at | timestamptz | |

`PATCH /api/payroll/{employee_id}` upserts: the first PATCH for an employee
creates the row (unset fields default to 0), later PATCHes update only the
fields included in the request body.

## Indexes / Constraints

- `users.email` — unique
- `users.employee_id` — unique
- `employees.user_id` — unique (enforces 1:1)
- `employees.employee_id` — unique
- `attendance(employee_id, date)` — unique (blocks duplicate same-day records)
- `attendance.employee_id` — indexed
- `leaves.employee_id` — indexed
- `leaves.status` — indexed
- `payroll.employee_id` — unique

## Environment Variables

| var | purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string, `postgresql+asyncpg://...` |
| `TEST_DATABASE_URL` | **Separate** database used only by `pytest` — never the dev DB |
| `JWT_SECRET_KEY` | HMAC signing key, ≥32 bytes |
| `JWT_ALGORITHM` | default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | default `60` |
| `CORS_ORIGINS` | comma-separated allowed origins, no `*` with credentials |

`.env` holds real values (gitignored). `.env.example` holds placeholders only.

**Why a separate `TEST_DATABASE_URL`:** the test suite truncates its tables
between every test. Pointing it at the dev database would wipe seeded
ADMIN/HR/EMPLOYEE accounts on every `pytest` run. `tests/conftest.py` refuses
to start if `TEST_DATABASE_URL` isn't set, specifically to prevent this.

## Local Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in real values
```

### Neon database setup

1. Create a Neon project and grab its pooled connection string for
   `DATABASE_URL`.
2. Create a second database in the **same** Neon project for tests (cheapest
   way to get isolation without a second project):
   ```sql
   CREATE DATABASE dayflow_test;
   ```
   Point `TEST_DATABASE_URL` at it (same host/credentials, different dbname).
3. Apply migrations to both databases:
   ```bash
   alembic upgrade head                                   # dev DB
   ALEMBIC_DATABASE_URL="$TEST_DATABASE_URL" alembic upgrade head   # test DB
   ```

### Run the server

```bash
uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs

### Run with Docker (backend + frontend together)

A root-level `docker-compose.yml` runs this backend alongside the
`frontend/` app (pulled from the `frontend-dev` branch). There's no database
container — both services connect straight to Neon using `backend/.env`, so
that file must exist and be filled in first (see above). `frontend/.env`
(`VITE_API_URL=http://localhost:8000`) must exist too.

```bash
docker compose up --build
```

- Backend: http://localhost:8000 (runs `alembic upgrade head` on every start,
  then `uvicorn --reload`; source is bind-mounted so edits reload live)
- Frontend: http://localhost:5175 (Vite dev server, also bind-mounted with
  live reload; the container's internal Vite port stays `5173` — only the
  host-side mapping was moved, to `5175:5173` in `docker-compose.yml`, to
  avoid clashing with another project already using `5173` locally)

`CORS_ORIGINS=http://localhost:5175` in `backend/.env` must match whatever
host port the frontend is published on — update both together if you change
it again. `docker compose down` stops both containers.

### Seed data

```bash
python -m scripts.seed
```

Creates (idempotent — safe to re-run):

| email | role | password |
|---|---|---|
| admin@dayflow.dev | ADMIN | AdminPass123! |
| hr@dayflow.dev | HR | HrPass123! |
| employee1@dayflow.dev | EMPLOYEE | EmpPass123! |
| employee2@dayflow.dev | EMPLOYEE | EmpPass123! |
| employee3@dayflow.dev | EMPLOYEE | EmpPass123! |

This is the **only** way to create an ADMIN account — public signup rejects
the `ADMIN` role by design.

### Run tests

```bash
pytest
```

Runs against `TEST_DATABASE_URL` via a FastAPI dependency override
(`app.dependency_overrides[get_db]`), never the dev database.

## API — Phase 1 (Authentication)

| method | path | auth | notes |
|---|---|---|---|
| POST | `/api/auth/signup` | none | `role` restricted to `EMPLOYEE`/`HR`; creates `users` + `employees` rows |
| POST | `/api/auth/login` | none | returns `{access_token, token_type}` |
| POST | `/api/auth/logout` | bearer token | stateless — see below |

### Authentication flow

1. `POST /api/auth/signup` — validates input, hashes password (Argon2),
   rejects duplicate email/employee_id, rejects `role=ADMIN`, creates the
   `User` and linked `Employee` rows.
2. `POST /api/auth/login` — verifies password, returns a JWT:
   `{"user_id": ..., "role": ..., "exp": ...}`, signed HS256.
3. Protected routes require `Authorization: Bearer <token>`.
   `get_current_user` decodes the token and loads the `User` row from the DB
   (so a deactivated user is rejected even with a still-valid token).
4. **Logout is stateless** — bearer tokens aren't stored server-side, so
   logout means the client discards the token. No revocation/blocklist exists
   in this MVP; add one only if a real requirement for immediate
   server-enforced revocation shows up.

### Role/permission matrix

| dependency | allows | used by |
|---|---|---|
| `get_current_user` | any authenticated, active user | `/auth/logout`, `/employees/me`, `/attendance/{check-in,check-out,me}`, `/leaves` (create/me/detail), `/payroll/me` |
| `require_employee` | EMPLOYEE, HR, ADMIN | (available; equivalent to `get_current_user` in practice — no endpoint needs "employee or higher" as distinct from "any authenticated user") |
| `require_hr` | HR only | (available; no HR-exclusive-of-ADMIN action was specified, so not currently used) |
| `require_admin` | ADMIN only | (available; no ADMIN-exclusive-of-HR action was specified, so not currently used) |
| `require_hr_or_admin` | HR, ADMIN | `/employees` list/detail/update, `/attendance` list/detail, `/leaves` list/approve/reject, `/payroll` detail/update |

Role is always read from the JWT / DB, never trusted from the request body.

## API — Phase 2 (Employee Profile)

| method | path | auth | notes |
|---|---|---|---|
| GET | `/api/employees/me` | any authenticated | own profile, merged with account fields (email/role/is_verified/is_active) |
| PATCH | `/api/employees/me` | any authenticated | only `phone`/`address`/`profile_picture` accepted — any other field in the body is silently ignored, not a validation error |
| GET | `/api/employees` | HR/ADMIN | list of all employees (basic fields) |
| GET | `/api/employees/{employee_id}` | HR/ADMIN | full profile of one employee |
| PATCH | `/api/employees/{employee_id}` | HR/ADMIN | name, contact info, job_title, department, joining_date |

**ASSUMPTION — `{employee_id}` path parameter:** the spec reuses the name
`employee_id` for both the human-readable code (e.g. `EMP001`, stored on both
`users` and `employees`) and, per the DB design section, as the FK target
`employees.id` used by `attendance`/`leaves`/`payroll`. This implementation
treats every `{employee_id}` path parameter (here and in Attendance) as the
**`employees.id` UUID**, for consistency with the documented foreign keys. A
client gets this UUID from `GET /api/employees/me` or from an employee-list
response — never from `users.employee_id`.

## API — Phase 3 (Attendance)

| method | path | auth | notes |
|---|---|---|---|
| POST | `/api/attendance/check-in` | any authenticated | 409 if already checked in today |
| POST | `/api/attendance/check-out` | any authenticated | 400 if no check-in yet today, 409 if already checked out |
| GET | `/api/attendance/me?start_date&end_date` | any authenticated | own records only; both date params optional |
| GET | `/api/attendance?employee_id&start_date&end_date` | HR/ADMIN | all records, all filters optional |
| GET | `/api/attendance/{employee_id}?start_date&end_date` | HR/ADMIN | one employee's records |

No attendance-policy engine exists — check-in always sets `status=PRESENT`;
`ABSENT`/`HALF_DAY`/`LEAVE` are schema values with no automatic trigger yet
(none was specified for the MVP).

## API — Phase 4 (Leave Management, employee side) & Phase 6 (approval)

| method | path | auth | notes |
|---|---|---|---|
| POST | `/api/leaves` | any authenticated | creates a `PENDING` request; 409 on overlap with own `PENDING`/`APPROVED` leave; 422 if `end_date < start_date` |
| GET | `/api/leaves/me` | any authenticated | own requests, newest first |
| GET | `/api/leaves/{leave_id}` | any authenticated | own leave, or any leave if HR/ADMIN; 404 (not 403) if an employee requests someone else's — avoids confirming the ID exists |
| GET | `/api/leaves?employee_id&status` | HR/ADMIN | list all, both filters optional |
| PATCH | `/api/leaves/{leave_id}/approve` | HR/ADMIN | body `{"comment": "..."}`; 409 if not currently `PENDING` |
| PATCH | `/api/leaves/{leave_id}/reject` | HR/ADMIN | same shape/rules as approve |

## API — Phase 5 (Admin/HR Employee Management)

Fully satisfied by Phase 2's `GET /api/employees` and
`GET /api/employees/{employee_id}` — no separate endpoints needed.

## API — Phase 7 (Payroll)

| method | path | auth | notes |
|---|---|---|---|
| GET | `/api/payroll/me` | any authenticated | 404 until HR/Admin has set up payroll for that employee |
| GET | `/api/payroll/{employee_id}` | HR/ADMIN | |
| PATCH | `/api/payroll/{employee_id}` | HR/ADMIN | upsert; any subset of the five salary fields |

## Testing

- `tests/test_auth.py` (Phase 1) — signup, signup rejecting `ADMIN`, duplicate
  email, duplicate employee_id, login success/failure, missing/invalid/valid
  token.
- `tests/test_employees.py` (Phase 2) — own-profile view/edit, restricted
  fields rejected, employee blocked from list/detail endpoints, HR list/view/
  update, 404 on unknown employee.
- `tests/test_attendance.py` (Phase 3) — check-in, duplicate check-in,
  check-out, checkout-before-checkin, duplicate checkout, employee sees only
  own records, employee blocked from admin endpoints, HR sees all records.
- `tests/test_leaves.py` (Phase 4 + 6) — apply, invalid date range, overlap
  rejected, own-leave view, cross-employee 404, HR view-any, employee blocked
  from list/approve, HR list/approve/reject, re-processing a decided leave
  rejected (409).
- `tests/test_payroll.py` (Phase 7) — payroll-not-set 404, employee blocked
  from modifying, HR sets and employee reads it back, HR views by employee_id,
  HR partial-update preserves untouched fields.

**Status: written for all phases, but the full suite has not yet been run
to completion in one clean pass** (Phase 1–2 were previously confirmed
green; Phase 3 was in progress when testing was deferred in favor of
finishing the remaining phases first, per direction). Run `pytest` and fix
whatever surfaces before treating any phase as verified — the code has been
carefully reviewed but not machine-checked end-to-end.

## MVP Limitations (current)

- Email verification has the necessary fields (`is_verified`,
  `verification_token`) but no email is actually sent — nothing consumes the
  token yet.
- No token revocation/blocklist — logout is client-side only.
- No attendance-policy engine (auto-marking `ABSENT`/`HALF_DAY`), no
  leave-balance tracking, tax calculation, payslip generation, or any of the
  other items explicitly excluded from the MVP (see the product spec).
- Payroll's `gross_salary`/`net_salary` are stored values HR/Admin enters
  directly, not computed from `basic_salary`/`allowances`/`deductions` — by
  design, since automatic salary calculation is explicitly out of scope.

## Future Enhancements (explicitly out of scope for this MVP)

Email notifications, push notifications, analytics dashboards, advanced
reporting, payslip generation, recruitment, performance management, tax
calculation, biometric/face-recognition attendance, AI features, chat,
payment processing, third-party HR integrations.
