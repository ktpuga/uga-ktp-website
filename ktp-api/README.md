# ktp-api

Node.js + Express + PostgreSQL backend for the KTP iOS app and website. Runs on port 4000.

## Architecture

- **Auth:** Authentik OIDC. The API validates Authentik JWTs on protected routes using `jose` (JWKS verification). Authentik holds usernames and passwords only — all profile data lives in PostgreSQL.
- **Database:** PostgreSQL. Users are keyed by their Authentik UUID (`authentik_id`).
- **Photos:** Immich (deferred — proxy routes not yet built). `GET /photos` returns records from the DB; `POST /photos` returns 501.
- **Deployment:** Runs as a Docker service alongside the Next.js website via `docker-compose.yml` in the repo root.

## Prerequisites

- PostgreSQL running and accessible (LXC, Docker, or host)
- Database created (e.g. `ugaktp_db`) with a user that has full privileges on it
- Authentik running with an OIDC application configured (slug: `ktpapp`)

## Setup

```sh
cp .env.example .env
# Fill in DATABASE_URL and AUTHENTIK_ISSUER
npm install
npm run db:init
```

`db:init` runs `db/schema.sql` (creates tables) then `db/seed.sql` (sample events).

Other scripts:

```sh
npm run db:schema   # schema only — safe to re-run, uses CREATE IF NOT EXISTS
npm run db:seed     # seed only
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://root:pass@192.168.1.x:5432/ugaktp_db` |
| `AUTHENTIK_ISSUER` | Authentik OIDC issuer URL, e.g. `https://auth.ugaktp.com/application/o/ktpapp/` (trailing slash required) |
| `PORT` | Port to listen on (default: 4000) |

## Run locally

```sh
npm start
```

Server: `http://localhost:4000`

## Endpoints

### Public

```text
GET  /                  — health check
GET  /members           — all members with profile_complete=true (iOS directory)
GET  /members/:id       — single member by Authentik UUID
GET  /photos            — all photos from DB (immich_asset_id + metadata)
POST /photos            — 501, pending Immich integration
GET  /events            — all events ordered by start date
POST /events            — create event
PUT  /events/:id        — update event
DELETE /events/:id      — delete event
```

### Protected (requires Authentik JWT — `Authorization: Bearer <token>`)

```text
POST /users/sync        — upserts user row on login, returns { profile_complete }
GET  /users/me          — returns authenticated user's full profile
PUT  /users/me/profile  — saves profile fields, sets profile_complete = true
```

### Admin only (JWT + eboard group required)

```text
GET  /admin/users       — list all users in the DB
```

## Authentication

Protected routes use `middleware/auth.js` which validates the Authentik JWT via JWKS:

```
JWKS URL: {AUTHENTIK_ISSUER}jwks/
```

The middleware sets `req.user = { authentik_id, username, groups }` on success.

Admin routes additionally use `middleware/requireGroup.js` which checks that the user's `groups` claim includes `eboard`.

## Onboarding flow

1. Admin creates user in Authentik UI, assigns to a group (`eboard`, `chair`, `active`, `alumni`, `pledge`)
2. User logs in → Authentik forces password reset on its own domain
3. Website `auth.ts` calls `POST /users/sync` → creates DB row, returns `profile_complete: false`
4. User is redirected to `/complete-profile` to fill in their profile
5. `PUT /users/me/profile` saves profile fields and sets `profile_complete = true`
6. User is routed to their portal based on group

## Database schema

Tables: `users`, `events`, `photos`, `messages`

Key fields on `users`:
- `authentik_id UUID PRIMARY KEY` — Authentik UUID, matches OIDC `sub` claim
- `member_group TEXT` — one of `active`, `pledge`, `eboard`, `chair`, `alumni`
- `profile_complete BOOLEAN` — gates access to portals
- `profile_picture_asset_id TEXT` — Immich asset ID (not a file path)

Schema file: `db/schema.sql`

## Deployment

The API is deployed as part of `docker-compose.yml` in the repo root. The `web` (Next.js) service reaches the API at `http://api:4000` over the internal Docker bridge network. The iOS app reaches it externally via the server's public IP on port 4000.

```sh
# On the server, after pulling latest code:
docker compose up --build -d

# Apply schema (first deploy, or after schema changes):
docker compose run --rm api node scripts/init-db.js --schema-only
```
