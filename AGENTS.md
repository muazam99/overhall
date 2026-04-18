<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older references. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Overhall Architecture Memory (Phase 1 Baseline)

This file is the persistent architecture contract for future chats/agents.

## Core rule

- Keep existing `app/` page and route hierarchy intact unless the user explicitly asks to change routing.
- Build around current routes, not by reshuffling them.

## Tech stack (must stay aligned)

- Next.js App Router
- shadcn/ui + Tailwind CSS v4
- Drizzle ORM + PostgreSQL
- Better Auth
- TanStack Query
- Zustand
- Zod

## Folder contract

- `app/`: routes, layout, providers, and API routes only
- `components/ui`: shared shadcn-style primitives
- `components/shared`: app-level reusable components
- `features/<feature>/`: feature modules with:
  - `components/`
  - `schemas/` (Zod contracts)
  - `server/` (server-only logic/actions)
  - `queries/` (TanStack query options/hooks)
  - `store/` (Zustand, provider-based)
- `db/`: Drizzle database setup
  - `schema/`
  - `relations.ts`
  - `index.ts`
- `lib/`: shared infra
  - `auth.ts`, `auth-client.ts`
  - `env.ts`
  - `query/*`
  - `utils.ts`
- `config/`, `hooks/`, `types/` for cross-cutting support
- `drizzle/`: generated migrations and metadata

## State and data boundaries

- TanStack Query is for server/stateful async data.
- Zustand is for client/UI state only.
- Do not consume Zustand store directly in server components.
- Prefer server prefetch/hydration boundaries for initial page data.

## Auth + DB rules

- Better Auth route lives at `app/api/auth/[...all]/route.ts`.
- Better Auth server instance lives in `lib/auth.ts`.
- Drizzle config is `drizzle.config.ts` with schema in `db/schema/index.ts` and output in `drizzle/`.
- Validate required env vars through `lib/env.ts` using Zod.

## Environment contract

Expected env vars:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`

Use `.env.example` as the source template.

## Scripts contract

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:studio`

## Implementation style

- Existing pages should compose feature modules instead of embedding business logic.
- Keep shared utility `cn()` in `lib/utils.ts`.
- Add new domain behavior under `features/` first, then wire into `app/` as composition glue.
