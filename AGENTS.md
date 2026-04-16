# PCIC Management System — AI Context

This file provides context for AI coding assistants (Cursor, GitHub Copilot, Windsurf, Cline, etc.).

## What This Project Is

Internal management system for the Peak Craft Informatics Community (PCIC) — a student community of 800+ across IS, CS, and IT at Hawassa University. The system handles event attendance, leadership decisions, disciplinary strikes, candidate applications, and member management.

## Tech Stack — Do Not Deviate

- **Frontend:** React 18 with JSX (NOT TypeScript), Vite, Shadcn UI, Tailwind CSS, React Router v6, TanStack React Query v5, react-hook-form + zod, Sonner toasts, Lucide icons
- **Backend:** Node.js, Express.js (ES modules), Mongoose ODM, JWT auth, Multer uploads, Nodemailer
- **Database:** MongoDB

## Critical Rules

1. **No TypeScript.** All files are `.js` or `.jsx`. No `.ts`, `.tsx`, no type annotations, no interfaces.
2. **ES modules everywhere.** Use `import`/`export`, never `require`/`module.exports`.
3. **Path alias `@/`** maps to `client/src/` — always use it for frontend imports.
4. **Tailwind CSS only** — no CSS modules, styled-components, or inline styles.
5. **Functional components** with hooks — no class components.
6. **React Query** for server state — no Redux, no Zustand.
7. **Backend pattern:** routes -> controllers -> models. Keep them in separate files.
8. **All API routes** are prefixed with `/api/`.

## Project Structure

```
client/src/
  api/axios.js              — Axios with JWT interceptor
  context/AuthContext.jsx    — Auth provider
  hooks/use*.js             — React Query hooks per feature
  components/ui/            — Shadcn primitives (don't modify)
  components/{module}/      — Feature components
  components/shared/        — Reusable (ProtectedRoute, RoleGate, PageHeader, etc.)
  pages/                    — Page components
  App.jsx                   — Router + layout

server/src/
  index.js                  — Express entry point
  config/db.js              — MongoDB connection
  middleware/auth.js         — JWT verification
  middleware/roleGuard.js    — Role-based access control
  models/                   — Mongoose schemas (User, Event, Decision, Strike, Candidate, SummerProjectSubmission)
  controllers/              — Business logic
  routes/                   — Route definitions
  utils/email.js            — Nodemailer helpers
  utils/upload.js           — Multer config
```

## User Roles

Stored `role` values map to community offices as follows: **president**, **vice_president** (`vice_president`), **secretary**, **product manager** (`pm`), **membership coordinator** (`mc`), **event team** (`event_organizer`), **public relations** (`pr`), **domain_leader**, **member**.

Hierarchy for guards is feature-specific (see `roleGuard.js`); it is not a single linear chain across all roles.

- Backend: `roleGuard("president", "pm")` middleware
- Frontend: `<RoleGate allowedRoles={["president", "pm"]}>` component

## PCIC domains (`User.domain` / `Event.domain`)

Only the four domains: **Code Crafters**, **Turing Tribe**, **Cyber Crew**, **Pixel Peeps**. Leadership accounts still use one of these values for the required `domain` field (see `server/src/constants/pcicDomains.js` and `client/src/lib/pcicDomains.js`).

## Adding a New Feature

1. Model in `server/src/models/`
2. Controller in `server/src/controllers/`
3. Routes in `server/src/routes/` — mount in `server/src/index.js`
4. React Query hook in `client/src/hooks/`
5. Components in `client/src/components/{feature}/`
6. Page in `client/src/pages/`
7. Route + nav in `client/src/App.jsx`

## Seed Data & Academic Calendar

- **Existing DBs** with pre–four-domain `domain` strings: run `npm run migrate:domains` from `server/` (or repo root `npm run migrate:domains`) before relying on members/events.
- **Dummy/test data** is created via `server/src/seed.js` (script: `npm run seed` in the `server/` folder).
- **Academic calendar data** for Hawassa University is seeded via `server/src/seed-academic-calendar.js` (script: `npm run seed:academic-calendar` in the `server/` folder).
- Academic calendar decisions are tagged with the marker `[Academic Calendar]` in the `description` field and **must not be deleted** when cleaning up dummy/test data.
- When writing cleanup scripts or deleting decisions in bulk, always exclude documents whose `description` contains `[Academic Calendar]`, or re-run `npm run seed:academic-calendar` after a full wipe to restore them.
