## KRACKED DEV GUIDE

For the kracked dev submission, here are the login credentials for testing as user and admin:

- Admin: `admin@test.com` / `12341234`
- Demo user: `test@test.com` / `12341234`

Use the admin account for `/admin` and the demo user account for standard booking/user flows.

These credentials are for local demo and kracked dev bounty review only

# Overhall

Architecture-first Next.js baseline using:

- shadcn/ui + Tailwind CSS
- Drizzle ORM + PostgreSQL
- Better Auth
- TanStack Query
- Zustand
- Zod

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a PostgreSQL database first

This project will not boot until `DATABASE_URL` points to a real PostgreSQL database.

Option A: use your local PostgreSQL install

```bash
createdb overhall
```

If `createdb` is not available, you can create it with `psql`:

```bash
psql -U postgres -c "CREATE DATABASE overhall;"
```

Option B: run PostgreSQL in Docker

```bash
docker run --name overhall-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=overhall -p 5432:5432 -d postgres:16
```

Default local connection string:

```bash
postgresql://postgres:postgres@localhost:5432/overhall
```

### 3. Copy the environment template

Use `.env.example` as the starting point for your local `.env`.

```bash
cp .env.example .env
```

If you are on Windows PowerShell and `cp` does not work:

```bash
Copy-Item .env.example .env
```

### 4. Fill the required `.env` values

At minimum, set these before starting the app:

- `DATABASE_URL`: PostgreSQL connection string for the database you created above
- `BETTER_AUTH_SECRET`: any long random string for local development
- `BETTER_AUTH_URL`: `http://localhost:3000`
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000`

You can generate a local auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cloudflare R2 variables are used for hall photo upload and photo URL generation:

- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL` (optional)

If you do not have R2 set up yet, the app can still be developed locally, but hall photo upload/delete flows and generated photo URLs will not work correctly until real R2 credentials are added.

### 5. Run the existing migrations

```bash
npm run db:migrate
```

`npm run db:generate` is only needed when you change the Drizzle schema and want to create a new migration. It is not required for a fresh clone.

### 6. Optionally seed sample data

```bash
npm run db:seed:halls
```

This seeds sample halls, amenities, and hackathon-ready demo accounts into your local database.

### 7. Start the app

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Cloudflare R2 (Hall Photos)

- Hall photos are stored in Cloudflare R2, and the database stores only the object `path` (not full URL).
- Configure these environment variables in `.env`:
  - `R2_ACCOUNT_ID`
  - `R2_BUCKET_NAME`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_PUBLIC_BASE_URL` (optional)
- Generate a direct upload URL from:
  - `POST /api/halls/photos/presigned-upload`
  - Request body: `{ "hallId": "...", "fileName": "...", "contentType": "image/jpeg" }`
  - Response: `{ "path": "...", "uploadUrl": "..." }`

Frontend flow:
1. Call the presigned endpoint.
2. Upload file directly to `uploadUrl` with `PUT`.
3. Save returned `path` in `hall_photo.path`.

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run lint`: lint source files
- `npm run db:generate`: generate a new SQL migration after changing the Drizzle schema
- `npm run db:migrate`: apply committed migrations to the configured PostgreSQL database
- `npm run db:studio`: open Drizzle Studio
- `npm run db:seed:halls`: seed sample halls, amenities, and hackathon demo accounts
- `npm run admin:promote -- you@example.com`: manually promote a user to admin role

## Folder Conventions

- `app/`: routes and layout (kept intact, no route reshuffle)
- `components/ui`: shadcn-style primitives
- `components/shared`: app-level reusable components
- `features/*`: feature modules with `components`, `schemas`, `server`, `queries`, `store`
- `db/`: Drizzle database client, schema, and relations
- `lib/`: shared infrastructure (`auth`, `env`, `query`, `utils`)

## RBAC and Auth

- Roles are enforced as `user` and `admin` on the `user.role` column.
- Registration always creates `role=user`.
- Admin role assignment is manual via `npm run admin:promote`, except for the seeded hackathon admin account created by `npm run db:seed:halls`.
- `/admin` is middleware-protected and server-guarded.
- Unauthorized admin access redirects to `/` and can auto-open login modal using short-lived cookies.

## API Endpoints (Role-Aware)

- `POST /api/profile/bootstrap`: authenticated profile bootstrap after registration.
- `GET /api/bookings`: list current user bookings.
- `POST /api/bookings`: create booking for authenticated user.
- `PATCH /api/bookings/:bookingId/status`: cancel own booking.
- `GET /api/admin/summary`: admin dashboard counters.
- `GET /api/admin/users`: list users (admin only).
- `PATCH /api/admin/users/:userId/role`: set user role (admin only).
- `GET /api/admin/halls`: list halls (admin only).
- `PATCH /api/admin/halls/:hallId/status`: set hall status (admin only).
- `GET /api/admin/bookings`: list bookings (admin only).
- `PATCH /api/admin/bookings/:bookingId/status`: set booking/payment status (admin only).
