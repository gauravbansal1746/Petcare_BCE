# 🐾 PetCare — Pet Caretaker Booking Platform

A full-stack **Node.js REST API** for connecting pet owners with professional caretakers. Built with a clean MVC architecture, JWT authentication, role-based access control, a mock payment system, structured logging, and production-ready security hardening.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Security](#security)

---

## Project Overview

PetCare is a platform where **pet owners (users)** can discover caretakers, create bookings, and process payments — while **caretakers** manage their profiles and respond to booking requests. An **admin** panel provides full oversight of users, clients, and caretakers.

The backend exposes a versioned REST API (`/api/v1/`) consumed by a vanilla HTML/CSS/JS + AngularJS frontend served from the same Express server.

---

## Features

### Authentication & Authorisation
- User registration with **bcrypt** password hashing (salt rounds: 10)
- JWT login — token carries `id`, `email`, and `role`; expires in 1 day
- Role-based access control across three roles: `user`, `caretaker`, `admin`
- Email availability check before registration

### User Roles
| Role | Capabilities |
|---|---|
| `user` | Register, login, manage own client profile, create bookings, process payments |
| `caretaker` | Register, login, manage own caretaker profile, confirm or cancel bookings |
| `admin` | Full read access to all users, clients and caretakers; block/resume users; delete records |

### Booking System
- Users create bookings for a specific caretaker and date
- Bookings start with status `pending`
- Caretakers can `confirm` or `cancel`; admins can set any status
- Business rules enforced: no self-booking, no past dates, no duplicate payment

### Mock Payment System
- Simulated payment processing (no real gateway)
- Card validation rules: must be 16 digits; cards ending in `0000` are declined
- On success: booking status → `confirmed`, payment status → `paid`
- On failure: booking status stays `pending`, payment status → `failed`
- Every attempt (success or failure) is logged to the `payments` table

### Validation
- All request bodies and query strings validated with **Joi** schemas
- Field-level error messages returned in a consistent array format
- Pagination query params (`page`, `limit`) validated and bounded (max 100)

### Performance
- MySQL **connection pool** (10 connections) — eliminates per-request connect overhead
- **9 database indexes** across all tables covering every `WHERE`, `JOIN`, and `ORDER BY` column
- **Paginated list endpoints** — count and data queries run in parallel
- Column-specific `SELECT` statements — no `SELECT *` on list queries

### Security
- **Helmet** — 14 HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — origin whitelist via environment variable, 24-hour preflight cache
- **Rate limiting** — three tiers: auth (20/15 min), API (100/min), public (30/min)
- **HPP** — HTTP Parameter Pollution protection
- Body size capped at **10 KB** (JSON/form); file uploads capped at **2 MB**
- `X-Powered-By` header removed; stack traces never sent to clients

### Logging
- **Winston** structured logger with daily rotating files
- Separate `error-YYYY-MM-DD.log` (14-day retention) and `combined-YYYY-MM-DD.log` (7-day retention)
- Every API request logged with method, URL, status code, response time, and authenticated user
- All error types (Joi, DB, AppError, unhandled) logged with full metadata

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18 |
| Framework | Express 4 |
| Database | MySQL 5/8 |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Validation | `joi` 17 |
| Logging | `winston` + `winston-daily-rotate-file` |
| Security Headers | `helmet` |
| CORS | `cors` |
| Rate Limiting | `express-rate-limit` |
| HPP Protection | `hpp` |
| File Uploads | `express-fileupload` |
| Config | `dotenv` |
| Frontend | HTML5, Bootstrap 5, AngularJS 1.x, jQuery |

---

## Architecture

```
Client Request
      │
      ▼
  Helmet / CORS / HPP / Rate Limiter
      │
      ▼
  Body Parser (10 KB limit)
      │
      ▼
  Request Logger (Winston)
      │
      ▼
  Route → validate(JoiSchema) → verifyToken → authorizeRoles(...)
      │
      ▼
  Controller  ──►  Model (SQL via pool)  ──►  MySQL
      │
      ▼
  JSON Response
      │
      ▼  (on any error)
  Global Error Handler (errorHandler.js)
      │
      ▼
  Consistent JSON error shape
```

---

## Folder Structure

```
petcare/
├── config/
│   ├── db.js               # MySQL connection pool + index creation
│   ├── logger.js           # Winston logger instance
│   ├── roles.js            # Role constants (user, caretaker, admin)
│   └── security.js         # Helmet, CORS, rate limiters, HPP config
│
├── controllers/
│   ├── authController.js       # signup, login, checkEmail
│   ├── adminController.js      # user/client/caretaker management
│   ├── bookingController.js    # create, update status, list bookings
│   ├── caretakerController.js  # caretaker profile CRUD + search
│   ├── clientController.js     # client profile CRUD
│   ├── pageController.js       # HTML page serving
│   └── paymentController.js    # mock payment processing
│
├── middlewares/
│   ├── auth.js             # JWT verification → populates req.user
│   ├── errorHandler.js     # global 4-arg Express error handler
│   ├── requestLogger.js    # per-request Winston logging
│   ├── role.js             # authorizeRoles(...roles) factory
│   └── validate.js         # Joi schema validation factory
│
├── models/
│   ├── Booking.js          # bookings table — all SQL + auto-create
│   └── Payment.js          # payments table — all SQL + auto-create
│
├── routes/
│   ├── admin.js            # /api/v1/admin/*
│   ├── auth.js             # /api/v1/auth/*
│   ├── booking.js          # /api/v1/bookings/*
│   ├── caretaker.js        # /api/v1/caretakers/*
│   ├── client.js           # /api/v1/clients/*
│   ├── pages.js            # HTML page routes
│   └── payment.js          # /api/v1/payments/*
│
├── utils/
│   ├── AppError.js         # structured error class with statusCode
│   ├── pagination.js       # parsePagination(query) helper
│   ├── paymentSimulator.js # mock card validation logic
│   └── schemas.js          # all Joi schemas in one place
│
├── public/                 # static frontend (HTML, CSS, JS)
│   ├── css/
│   ├── js/
│   ├── pics/
│   └── uploads/            # user-uploaded profile/ID images
│
├── logs/                   # auto-created; gitignored
├── .env                    # environment variables (gitignored)
├── .gitignore
├── app.js                  # Express app — middleware + routes
├── package.json
└── server.js               # entry point — starts HTTP server
```

---

## Database Schema

```sql
-- Users (managed by MySQL, not auto-created)
users (
  emailid  VARCHAR(255) PRIMARY KEY,
  pwd      VARCHAR(255),           -- bcrypt hash
  utype    VARCHAR(50),            -- 'user' | 'caretaker' | 'admin'
  status   TINYINT DEFAULT 1       -- 1=active, 0=blocked
)

-- Client profiles
clients (
  email      VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(100),
  mobile     VARCHAR(15),
  address    TEXT,
  city       VARCHAR(100),
  state      VARCHAR(100),
  pin        VARCHAR(10),
  profilepic VARCHAR(255),
  idproofpic VARCHAR(255),
  pets       TEXT
)

-- Caretaker profiles
caretakers (
  email      VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(100),
  mobile     VARCHAR(15),
  address    TEXT,
  website    VARCHAR(255),
  state      VARCHAR(100),
  city       VARCHAR(100),
  pin        VARCHAR(10),
  selpets    TEXT,
  idproofpic VARCHAR(255)
)

-- Bookings (auto-created on server start)
bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  userId        VARCHAR(255)  FK → users.emailid,
  caretakerId   VARCHAR(255)  FK → users.emailid,
  date          DATE,
  status        ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  paymentStatus ENUM('unpaid','paid','failed') DEFAULT 'unpaid',
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Payments (auto-created on server start)
payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  bookingId     INT           FK → bookings.id,
  userId        VARCHAR(255)  FK → users.emailid,
  amount        DECIMAL(10,2),
  status        ENUM('success','failed'),
  transactionId VARCHAR(100),
  reason        VARCHAR(255),
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Endpoints

All API routes are prefixed with `/api/v1/`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/signup` | ✗ | — | Register a new user |
| `POST` | `/login` | ✗ | — | Login and receive JWT |
| `GET` | `/check-email` | ✗ | — | Check if email is available |

**POST /signup — Request body**
```json
{
  "emailForServer": "alice@example.com",
  "pwdForServer":   "secret123",
  "typeForServer":  "user"
}
```

**POST /login — Response**
```json
{
  "status": "success",
  "token":  "eyJhbGci...",
  "role":   "user"
}
```

---

### Client Profiles — `/api/v1/clients`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/profile?emailforServer=` | ✗ | — | Fetch a client profile |
| `POST` | `/profile` | ✓ | `user`, `admin` | Create client profile |
| `PUT` | `/profile` | ✓ | `user`, `admin` | Update client profile |

---

### Caretaker Profiles — `/api/v1/caretakers`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/?cityforserver=&petforserver=` | ✗ | — | Search caretakers by city and pet type (paginated) |
| `GET` | `/cities` | ✗ | — | List all distinct cities |
| `GET` | `/profile?emailforServer=` | ✗ | — | Fetch a caretaker profile |
| `POST` | `/profile` | ✓ | `caretaker`, `admin` | Create caretaker profile |
| `PUT` | `/profile` | ✓ | `caretaker`, `admin` | Update caretaker profile |

---

### Bookings — `/api/v1/bookings`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/` | ✓ | `user` | Create a new booking |
| `PATCH` | `/:id/status` | ✓ | `caretaker`, `admin` | Update booking status |
| `GET` | `/my?page=&limit=` | ✓ | `user`, `admin` | Get logged-in user's bookings |
| `GET` | `/caretaker?page=&limit=` | ✓ | `caretaker`, `admin` | Get caretaker's assigned bookings |

**POST / — Request body**
```json
{
  "caretakerId": "bob@example.com",
  "date":        "2025-08-15"
}
```

**PATCH /:id/status — Request body**
```json
{ "status": "confirmed" }
```
> Caretakers may only set `confirmed` or `cancelled`. Admins may set any value.

**GET /my — Response**
```json
{
  "status":   "success",
  "bookings": [ { "id": 1, "caretakerId": "bob@example.com", "date": "2025-08-15", "status": "confirmed", "paymentStatus": "paid" } ],
  "pagination": { "total": 12, "page": 1, "limit": 10, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
}
```

---

### Payments — `/api/v1/payments`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/:bookingId` | ✓ | `user` | Process mock payment for a booking |

**Request body**
```json
{
  "cardNumber": "1234567812345678",
  "amount":     500
}
```

**Success response (200)**
```json
{
  "status":        "success",
  "message":       "Payment successful. Booking confirmed.",
  "transactionId": "TXN-1720000000000-AB3X9Z",
  "bookingStatus": "confirmed",
  "paymentStatus": "paid"
}
```

**Failure response (402)**
```json
{
  "status":        "fail",
  "message":       "Payment failed. Booking remains pending.",
  "reason":        "Card declined by issuing bank.",
  "bookingStatus": "pending",
  "paymentStatus": "failed"
}
```

> **Simulator rules:** 16-digit cards ending in `0000` are always declined. All other valid 16-digit cards succeed.

---

### Admin — `/api/v1/admin`

All admin routes require a valid JWT with role `admin`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users?page=&limit=` | List all users (paginated) |
| `GET` | `/clients?page=&limit=` | List all clients (paginated) |
| `GET` | `/users/block?xEmail=` | Block a user account |
| `GET` | `/users/resume?xEmail=` | Unblock a user account |
| `GET` | `/clients/delete?xEmail=` | Delete a client record |
| `GET` | `/caretakers/delete?xEmail=` | Delete a caretaker record |

---

### Consistent Error Response Shape

Every error in the system returns the same JSON structure:

```json
{
  "status":  "fail",
  "message": "Human-readable description"
}
```

Joi validation failures include a field-level `errors` array:

```json
{
  "status":  "fail",
  "message": "Validation failed.",
  "errors": [
    { "field": "emailForServer", "message": "emailForServer must be a valid email address" },
    { "field": "pwdForServer",   "message": "pwdForServer must be at least 6 characters" }
  ]
}
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MySQL 5.7+ or 8.x
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/your-username/petcare.git
cd petcare
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the MySQL database and base tables

```sql
CREATE DATABASE petcare;
USE petcare;

CREATE TABLE users (
  emailid VARCHAR(255) PRIMARY KEY,
  pwd     VARCHAR(255) NOT NULL,
  utype   VARCHAR(50)  NOT NULL,
  status  TINYINT      NOT NULL DEFAULT 1
);

CREATE TABLE clients (
  email      VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(100),
  mobile     VARCHAR(15),
  address    TEXT,
  city       VARCHAR(100),
  state      VARCHAR(100),
  pin        VARCHAR(10),
  profilepic VARCHAR(255),
  idproofpic VARCHAR(255),
  pets       TEXT
);

CREATE TABLE caretakers (
  email      VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(100),
  mobile     VARCHAR(15),
  address    TEXT,
  website    VARCHAR(255),
  state      VARCHAR(100),
  city       VARCHAR(100),
  pin        VARCHAR(10),
  selpets    TEXT,
  idproofpic VARCHAR(255)
);
```

> The `bookings` and `payments` tables are **created automatically** when the server starts. All indexes are also applied automatically on startup.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your_strong_random_secret_min_32_chars
JWT_EXPIRES_IN=1d
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### 5. Start the server

```bash
npm start
```

The server starts on **http://localhost:3000**.

You should see:
```
2025-01-15 10:00:00 [info] Database pool connected successfully
2025-01-15 10:00:00 [info] Bookings table ready.
2025-01-15 10:00:00 [info] Payments table ready.
2025-01-15 10:00:00 [info] Server started on port 3000
```

### 6. Create an admin user

Insert an admin directly into the database (password must be a bcrypt hash):

```sql
-- Hash 'admin123' with bcrypt rounds=10, then insert:
INSERT INTO users VALUES ('admin@petcare.com', '<bcrypt_hash>', 'admin', 1);
```

You can generate the hash with a quick Node script:
```bash
node -e "require('bcryptjs').hash('admin123', 10, (e,h) => console.log(h))"
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | ✓ | — | Secret key for signing JWTs. Use a random 32+ char string in production |
| `JWT_EXPIRES_IN` | ✓ | `1d` | JWT expiry duration (e.g. `1d`, `2h`, `30m`) |
| `NODE_ENV` | ✓ | `development` | Set to `production` to enable HSTS and HTTPS upgrade headers |
| `ALLOWED_ORIGIN` | ✓ | `http://localhost:3000` | Comma-separated list of allowed CORS origins |
| `LOG_LEVEL` | ✗ | `info` | Winston log level: `error`, `warn`, `info`, `debug` |

---

## Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt, 10 salt rounds |
| Authentication | JWT, 1-day expiry, Bearer token |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, noSniff, referrer policy, …) |
| CORS | Origin whitelist, 24-hour preflight cache |
| Brute-force protection | Auth rate limiter: 20 requests / 15 minutes per IP |
| API rate limiting | 100 requests / minute per IP |
| Parameter pollution | HPP middleware strips duplicate query params |
| Payload size | JSON and form bodies capped at 10 KB; files at 2 MB |
| SQL injection | All queries use parameterised placeholders (`?`) |
| Error leakage | Stack traces logged server-side only, never sent to clients |
| Secrets | `.env` gitignored; no credentials in source code |
