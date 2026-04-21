# Overhall

Architecture-first Next.js baseline using:

- shadcn/ui + Tailwind CSS
- Drizzle ORM + PostgreSQL
- Better Auth
- TanStack Query
- Zustand
- Zod

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and fill values:

```bash
cp .env.example .env
```

3. Run migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

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
- `npm run db:generate`: generate SQL migrations from Drizzle schema
- `npm run db:migrate`: apply migrations
- `npm run db:studio`: open Drizzle Studio
- `npm run db:seed:halls`: seed sample halls and amenities
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
- Admin role assignment is manual only via `npm run admin:promote`.
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
