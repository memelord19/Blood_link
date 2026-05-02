# BloodLink — Blood Bank Management Platform

## Project Overview

Full-stack centralized blood bank management platform for the Tunisian healthcare system.

**4 user roles:**
- **Donor** — Register, book appointments, fill medical forms, view donation history and notifications
- **Transfusion Center** (`transfusion_center`) — Manage donors, appointments, blood collection, stock, requests, deliveries
- **Blood Bank** (`blood_bank`) — Receive/inspect bags, manage stock, create shortage alerts, process requests
- **Hospital / Clinic** — Submit blood requests, track deliveries, pay invoices

**Design palette:** `#C0392B` (red/primary), `#FFFFFF` (white), `#F5F5F5` (gray), `#2C3E50` (navy/sidebar)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **Frontend**: React + Vite + Tailwind + shadcn/ui + framer-motion + wouter

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

```
artifacts/
  api-server/      — Express 5 REST API (port 8080, proxied at /api)
  bloodlink/       — React + Vite frontend (proxied at /)
lib/
  db/              — Drizzle schema + migrations (8 tables)
  api-spec/        — OpenAPI spec (openapi.yaml)
  api-client-react/ — Generated React Query hooks (Orval)
  api-zod/         — Generated Zod schemas (Orval)
scripts/
  src/seed.ts      — Database seeder (run via executeSql in code_execution)
```

## Database Tables

1. `users` — all roles (donor, transfusion_center, blood_bank, hospital, clinic)
2. `donors` — donor medical profile linked to user
3. `appointments` — donation appointments
4. `blood_bags` — individual bag tracking with barcodes
5. `donations` — completed donation records
6. `blood_requests` — requests from hospitals/clinics to centers
7. `alerts` — shortage alerts from blood banks
8. `invoices` — billing for clinic blood deliveries
9. `notifications` — in-app notifications per user

## Auth

- Token: `base64(userId:timestamp)` stored in `localStorage` as `bl_token`
- User stored as `bl_user` in localStorage
- `setAuthTokenGetter` from `@workspace/api-client-react` injects Bearer token into all API calls
- Middleware: `authMiddleware` in `artifacts/api-server/src/lib/auth.ts`

## Demo Accounts (password: demo123)

| Role | Email |
|---|---|
| Donor | ahmed.ben@demo.tn |
| Transfusion Center | centre@cnts.tn |
| Blood Bank | banque@blood.tn |
| Hospital | hopital@sante.tn |
| Clinic | clinique@sante.tn |

## Mutation Hook Calling Convention

All Orval-generated mutations use `{ data: Body }` or `{ id, data: Body }` format:
```ts
// Correct:
loginMutation.mutateAsync({ data: { email, password } })
createAppointment.mutateAsync({ data: { centerId, date, time } })
updateBloodRequest.mutateAsync({ id, data: { status } })
// ID-only mutations (e.g. markNotificationRead):
markRead.mutateAsync({ id })
```

## Route Structure

```
/                          — Landing page (public)
/login                     — Login (public)
/register                  — Donor registration (public)
/donor/*                   — Donor pages (role: donor)
/center/*                  — Center/bank pages (role: transfusion_center | blood_bank)
/establishment/*           — Hospital/clinic pages (role: hospital | clinic)
```
