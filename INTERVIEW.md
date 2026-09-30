# Interview Preparation — URL Shortener

## Basic

**What problem does a URL shortener solve?**
Long URLs are hard to share, look ugly and break in some messages. A short link is easy to share, can be tracked (clicks), and can be controlled (disabled or expired).

**How does the application work?**
A logged-in user submits a long URL. The server validates it, creates a unique short code, and stores the mapping in MongoDB. When anyone visits `/<code>`, the server looks up the code and redirects to the original URL, counting the click.

**Explain the request flow.**
Browser → React → Axios (adds JWT) → Express → middleware (rate limit, auth) → controller → service → Mongoose → MongoDB → JSON back. For redirects: browser → `GET /:code` → service (cache, then DB) → `302` with `Location` header.

**Why MongoDB?**
Data is simple, document-shaped, and needs no joins, and the schema is easy to evolve. The main query is a key lookup. Honest trade-off: SQL would also work well here; the "user has many URLs" relation is simple in both.

**Why Express?**
Minimal, unopinionated, huge ecosystem, and its middleware model makes auth, validation and error handling easy to compose.

## Backend

**What is REST?**
An API style where resources (URLs, users) have addresses, and HTTP methods express actions: POST creates, GET reads, PATCH partially updates, DELETE removes. The server is stateless, and status codes carry meaning.

**What is middleware?**
A function `(req, res, next)` that runs between the request and the final handler. Examples here: `express.json()`, rate limiter, `protect` (auth), and the error handler. Calling `next()` continues; `next(err)` jumps to the error handler.

**How does JWT authentication work?**
On login the server signs a token containing the user id with `JWT_SECRET`. The client sends it in `Authorization: Bearer`. The server verifies the signature and expiry, so it needs no session storage. Tokens are signed, not encrypted: never put secrets in them.

**Why hash passwords?**
If the database leaks, plain passwords are exposed everywhere users reused them. bcrypt is a slow, salted hash: each password gets a unique salt and the cost makes brute force expensive. Hashes can't be reversed; we compare by hashing the attempt.

**How do protected routes work?**
Backend: `protect` middleware rejects requests without a valid token (`401`). Frontend: `ProtectedRoute` redirects to `/login` if there's no user. The frontend check is only UX; the backend check is the real security.

**Why check ownership, and what's the difference between 401 and 403?**
Logged in is not enough: user A must not edit user B's URL. `401` = not authenticated; `403` = authenticated but not allowed.

## Database

**Explain the schema.** See README: `User` and `Url`; `Url.userId` references `User`.

**Relationship between User and URL?**
One-to-many: one user owns many URLs; each URL has one owner (`userId` reference).

**Why index `shortCode`?**
Every redirect queries by it. Without an index MongoDB scans every document (O(n)); with the B-tree index it's O(log n). As a unique index it also prevents duplicates.

**What if two users generate the same short code?**
Both inserts run; the unique index lets one succeed and rejects the other with error `11000`. The code catches that and retries with a new code. This is safer than "check if exists, then insert", which has a race condition.

**Why `{userId, createdAt}` index?**
The dashboard filters by user and sorts by newest; a compound index serves both without scanning or in-memory sorting.

## URL Shortening

**How do you generate short codes?**
6 random Base62 characters via `crypto.randomInt`, with retry on collision.

**What is Base62?**
Using 62 symbols (0-9, A-Z, a-z) to represent numbers/strings compactly. Alternative approach: take an auto-increment ID and convert it to Base62: no collisions, but sequential and guessable, and needs a central counter (harder when scaling out).

**How do you handle collisions?**
Unique index + retry (max 5). Custom aliases return `409` instead of retrying, because the user asked for that exact name.

**What happens when someone visits `/abc123`?**
Look up `abc123` (cache first, then DB) → not found: `404` · disabled: `403` · expired: `410` · otherwise atomically `$inc` clickCount, set lastClickedAt, and send `302` to the original URL.

**301 vs 302?**
`301` is permanent and browsers cache it, so later clicks bypass our server and analytics break. `302` is temporary, so every click reaches us.

## Performance

**Complexity of a lookup?** O(log n) via B-tree index (hash-based stores would be O(1) average).

**How would you handle millions of URLs?**
Keep the unique index, add a cache for hot codes, paginate all lists, add a TTL index to delete expired data, and eventually shard by `shortCode` (hashed shard key).

**Why could Redis be useful?**
In-memory, very fast, and shared between servers. Uses: cache `code → originalUrl` (this project has a per-process version of it), shared rate limiting, and buffering click counts.

**What is caching?**
Keeping frequently-read data in faster storage to avoid repeating slow work. The hard part is invalidation: here we delete the cached entry on PATCH/DELETE and use a 60s TTL as a safety net.

## System Design (progressive)

**Level 1: 1,000 users.**
What you built: one Express server, one MongoDB, unique index. Load is tiny; simplicity wins.

**Level 2: 1 million users.**
Reads dominate writes (redirects ≫ creations). Run multiple stateless API servers behind a load balancer, add Redis cache for redirects, MongoDB replica set (reads from secondaries, failover), shared rate limiting in Redis, pagination everywhere, and TTL cleanup of expired URLs. Move click counting off the hot path (batch or queue) so a redirect doesn't need a DB write.

**Level 3: millions of redirects per second.**
Conceptual only: serve redirects from a CDN/edge cache with short TTLs; Redis cluster in front of a sharded database (shard by hashed code); pre-generate unique code ranges per server (or use a key-generation service) to avoid collision checks; write clicks to a queue/log (e.g. Kafka) and aggregate asynchronously; separate read path (redirect) from write/analytics path; multi-region deployment. Trade-off: eventual consistency for click counts and a slower propagation of disable/delete (cache TTL).

## Questions to be ready for
- "What would you improve?" → tests, httpOnly cookies, Redis, Docker, QR codes, click history.
- "What are the security limits?" → see README Security Notes.
- "What was the hardest bug/decision?" → be ready to talk about collision handling or 301 vs 302.
