# كُتَّاب الرحمن

نظام إدارة متكامل لدور تحفيظ القرآن الكريم — بالعربية الكاملة مع دعم RTL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/kuttab run dev` — run the frontend (port 20581)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Fonts: Cairo (UI) + Amiri (headings) — Google Fonts
- Colors: Dark Forest Green #1a4a30 + Gold #d4a017 + Cream #f7f3ec

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle ORM tables (one file per entity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/kuttab/src/` — React frontend
- `artifacts/kuttab/src/contexts/AuthContext.tsx` — auth state
- `artifacts/kuttab/src/pages/` — all page components

## Architecture decisions

- Session-based auth (express-session) — sheikh sessions and student sessions share the same mechanism but different fields
- Sheikh activation code is hardcoded as `sheikh@119955` — no Supabase needed
- Student login uses a single unique code `KR-XXXXXX` — no email/password
- All API routes are under `/api`, frontend at `/`
- RTL enforced at HTML root via `dir="rtl" lang="ar"`

## Auth

| Role | Method | Credentials |
|------|--------|-------------|
| Sheikh (new) | POST /api/auth/sheikh/register | email + password + activationCode (`sheikh@119955`) + name |
| Sheikh (existing) | POST /api/auth/sheikh/login | email + password |
| Student | POST /api/auth/student/login | studentCode (e.g. `KR-100001`) |

**Demo sheikh**: `sheikh@kuttab.com` / (register first with activation code `sheikh@119955`)  
**Demo students**: `KR-100001` through `KR-100006`

## DB Schema (tables)

`sheikhs`, `circles`, `students`, `memorization_records`, `attendance_records`, `vacations`, `guardians`, `payments`, `expenses`, `certificates`, `exams`, `exam_results`

## Product

A full-featured Quran memorization school management system for sheikhs (teachers) with:
- Student management with auto-generated student codes (KR-XXXXXX)
- Circles (حلقات) management with Zoom/Meet links
- Daily memorization tracking (سورة، آيات، تقييم)
- Attendance marking (حاضر/غائب/متأخر/معذور)
- Vacations, guardians, payments, expenses, certificates, exams
- Smart analytics dashboard with charts
- Student portal — students log in with their code and see personal progress

## User preferences

- Full Arabic UI, RTL direction
- Dark forest green + gold + cream palette
- Cairo font for UI, Amiri for headings

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` if you change `lib/db/src/schema/` — the leaf typecheck needs fresh lib declarations
- Numeric fields from DB (amount, score) come back as strings from pg — parse with `parseFloat()` before returning in API responses
- Session module augmentation for express-session is in `artifacts/api-server/src/routes/auth.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
