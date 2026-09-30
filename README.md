# ShortLink — URL Shortener (MERN)

A full-stack URL shortener with authentication, custom aliases, expiring links, click analytics and a React dashboard. Built as a beginner-friendly portfolio project that demonstrates REST API design, database modelling, JWT auth and HTTP redirects.

## Features
- Register / login with JWT authentication and bcrypt password hashing
- Create short URLs (random Base62 code or custom alias)
- Optional expiration date
- Redirect with click counting (`302`)
- Dashboard: copy, enable/disable, delete, pagination
- Per-URL analytics: total clicks, created date, last clicked
- Validation, centralized JSON error handling, rate limiting
- Small in-memory cache on the redirect path

## Tech Stack
React (Vite), React Router, Axios · Node.js, Express · MongoDB, Mongoose · JWT, bcryptjs, express-rate-limit

## Architecture
```text
React (Vite)
   ↓  Axios + JWT header
Express REST API   (routes → middleware)
   ↓
Controllers / Services   (HTTP layer / business rules)
   ↓
MongoDB (Mongoose models)
```
- **Routes** map URLs to controllers. **Controllers** handle HTTP only (read request, send response). **Services** hold business logic (validation, code generation, ownership checks). **Models** define the schema and indexes.

## Folder Structure
```text
server/src/  config/db.js · controllers/ · middleware/ · models/ · routes/ · services/ · utils/ · app.js · server.js
client/src/  components/ · pages/ · services/api.js · context/AuthContext.jsx · App.jsx · main.jsx
```

## Database Schema
**User**: `_id, name, email (unique), passwordHash (select:false), createdAt`

**Url**: `_id, userId → User, originalUrl, shortCode (unique), customAlias, clickCount, lastClickedAt, expiresAt, isActive, createdAt, updatedAt`

One user has many URLs (one-to-many, via `userId`).

| Index | Why |
|---|---|
| `User.email` (unique) | Fast login lookup; prevents duplicate accounts |
| `Url.shortCode` (unique) | Redirect lookup is O(log n); database guarantees no duplicate codes |
| `Url.{userId, createdAt}` | Dashboard query: "my URLs, newest first" without scanning all URLs |
| `Url.customAlias` | Stored in `shortCode` as well, so the `shortCode` unique index already enforces alias uniqueness; a separate index is unnecessary |

## API Documentation
All responses are JSON: `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.
Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Body: `name, email, password` → `201` token + user |
| POST | `/api/auth/login` | No | Body: `email, password` → token + user |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/urls` | Yes | Body: `originalUrl` (+ optional `customAlias`, `expiresAt`) → `201` |
| GET | `/api/urls?page=1&limit=10` | Yes | Your URLs, paginated |
| GET | `/api/urls/:id` | Yes | One URL (must be yours) |
| PATCH | `/api/urls/:id` | Yes | Body: `isActive` (bool) and/or `expiresAt` (date or null) |
| DELETE | `/api/urls/:id` | Yes | Delete a URL |
| GET | `/api/urls/:id/analytics` | Yes | `totalClicks, createdDate, lastClicked` |
| GET | `/:shortCode` | No | `302` redirect to original URL |

Status codes: `400` validation · `401` not logged in / bad credentials · `403` disabled link or not your URL · `404` not found · `409` email/alias already taken · `410` link expired · `429` rate limited · `500` server error.

## Authentication Flow
1. Register/login → server hashes/compares password with bcrypt, returns a signed JWT (7 days).
2. Client stores the token in `localStorage`; an Axios interceptor adds it to every request.
3. `protect` middleware verifies the token, loads the user, and sets `req.user`.
4. Logout = client deletes the token (JWTs are stateless).

## URL Shortening Flow
```text
POST /api/urls → validate → generate code (or use alias) → insert → return short URL
GET /:code → find (cache, then DB) → exists? active? expired? → increment clicks → 302 redirect
```

## Short-Code Generation
- **Why:** a short code is a compact unique key that maps to a long URL.
- **How:** 6 random characters from Base62 (`0-9 A-Z a-z`) using `crypto.randomInt`. 62⁶ ≈ 56.8 billion combinations.
- **Uniqueness:** the `shortCode` unique index. We insert directly; on a duplicate-key error (`11000`) we retry with a new code (max 5). This is safe under concurrency, unlike "check then insert".
- **Lookup complexity:** O(log n) using the B-tree index (effectively constant in practice).

## Installation
Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).
```bash
# Backend
cd server && cp .env.example .env && npm install && npm run dev
# Frontend (new terminal)
cd client && npm install && npm run dev
```
Open http://localhost:5173.

## Environment Variables (`server/.env`)
| Name | Purpose |
|---|---|
| `PORT` | API port (5000) |
| `MONGO_URI` | MongoDB connection string |
| `BASE_URL` | Base used to build short URLs (e.g. `http://localhost:5000`) |
| `CLIENT_URL` | Allowed CORS origin |
| `JWT_SECRET` | Secret for signing tokens. Use a long random value |
| `JWT_EXPIRES_IN` | Token lifetime (`7d`) |

## Screenshots
_Add screenshots of Landing, Dashboard and Analytics here._

## Security Notes and Limitations
Implemented: bcrypt hashing, JWT, env-based secrets, input validation, ownership checks, rate limiting, no password in responses. **This is not production-grade.** Known gaps: token in `localStorage` (XSS risk; httpOnly cookies are safer), no refresh tokens or token revocation, in-memory rate limiter and cache (per-process), no email verification or password reset, no malicious-URL scanning, no HTTPS setup, and no automated tests.

## Future Improvements
Redis for cache and rate limiting · automated tests (Jest/Supertest) · QR codes · click history by day · refresh tokens / httpOnly cookies · Docker Compose · TTL index to auto-clean expired URLs.

## Learning Outcomes
REST design and status codes · layered architecture · Mongoose schemas and indexes · password hashing and JWT · middleware · race-safe uniqueness via unique indexes · HTTP redirects (301 vs 302) · React context, protected routes and Axios interceptors.
