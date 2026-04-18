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

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run lint`: lint source files
- `npm run db:generate`: generate SQL migrations from Drizzle schema
- `npm run db:migrate`: apply migrations
- `npm run db:studio`: open Drizzle Studio

## Folder Conventions

- `app/`: routes and layout (kept intact, no route reshuffle)
- `components/ui`: shadcn-style primitives
- `components/shared`: app-level reusable components
- `features/*`: feature modules with `components`, `schemas`, `server`, `queries`, `store`
- `db/`: Drizzle database client, schema, and relations
- `lib/`: shared infrastructure (`auth`, `env`, `query`, `utils`)
