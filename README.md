# PCIC Internal Management System

Web platform for the **Peak Craft Informatics Community** (PCIC) — digitizing membership tracking, event attendance, leadership decision-making, and disciplinary workflows for 800+ students across IS, CS, and IT departments at Hawassa University.

[Project Charter](https://docs.google.com/document/d/13s_bz3TTA7pzrWkVOkqtRqvQMdi11rO7mzkxiCkHwxc/edit?usp=sharing)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (JSX) + Vite + Shadcn UI + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |

## Quick Start

### Prerequisites

- **Node.js 20 LTS or 22 LTS** (avoid v24 — it has known TLS issues with MongoDB Atlas)
- **MongoDB** — the team uses a shared [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (see below)
- **Git**

### 1. Clone and install

```bash
git clone <repo-url>
cd PCIC-Management-System

# Install all dependencies (client + server) in one command
npm run setup
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with the shared Atlas connection string (ask the team lead for credentials):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@pcic-cluster.o0hy3tf.mongodb.net/pcic?appName=PCIC-cluster
JWT_SECRET=pick-a-random-secret-string
PORT=5000
```

> **Atlas setup (first time only):** Go to [Atlas Network Access](https://cloud.mongodb.com/) and add your IP address. Without this, connections will fail with a TLS error.

### 3. Seed test data (optional but recommended)

```bash
cd server
npm run seed
```

If you **keep an existing database** (not a full re-seed) after pulling changes that narrowed `User.domain` / `Event.domain` to the four PCIC domains, run once:

```bash
cd server
npm run migrate:domains
```

After seeding (or migrating), run tests from `server/` (uses `server/.env` for `MONGODB_URI`):

```bash
cd server
npm test
```

- **Unit tests** (roster shape / uniqueness) always run.
- **DB checks** are skipped unless roster users exist (run `npm run seed` first so emails like `student.code-crafters.1@pcic.com` are present).

This creates test accounts you can log in with:

| Role | Email | Password |
|------|-------|----------|
| President | president@pcic.com | password123 |
| Vice President | vice.president@pcic.com | password123 |
| Project Manager | pm@pcic.com | password123 |
| Secretary | secretary@pcic.com | password123 |
| Public Relations (PR) | pr@pcic.com | password123 |
| Event Lead | events.lead@pcic.com | password123 |
| Membership Coordinator | mc@pcic.com | password123 |
| Domain Leader (Code Crafters) | leader.codecrafters@pcic.com | password123 |
| Domain Leader (Turing Tribe) | leader.turingtribe@pcic.com | password123 |
| Domain Leader (Cyber Crew) | leader.cybercrew@pcic.com | password123 |
| Domain Leader (Pixel Peeps) | leader.pixelpeeps@pcic.com | password123 |
| Member | abebe@pcic.com | password123 |
| Batch 1 summer demo (pending submission) | summer.batch1@pcic.com | password123 |

### 4. Run

```bash
# Terminal 1 — Backend API (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173 and log in.

## Project Structure

```
client/                         React frontend
  src/api/axios.js              API client (JWT auto-attached)
  src/context/AuthContext.jsx    Auth state provider
  src/hooks/                    React Query hooks (useEvents, useMembers, etc.)
  src/components/ui/            Shadcn UI primitives
  src/components/{module}/      Feature components
  src/components/shared/        Reusable components
  src/pages/                    Page components
  src/App.jsx                   Router + sidebar layout

server/                         Express backend
  src/index.js                  App entry point
  src/config/db.js              MongoDB connection
  src/middleware/auth.js         JWT verification
  src/middleware/roleGuard.js    Role-based access
  src/models/                   Mongoose schemas
  src/controllers/              Route handlers
  src/routes/                   API route definitions
  src/utils/                    Email + file upload helpers
  src/seed.js                   Database seeder
  src/migrate-legacy-domains.js         One-shot legacy domain labels → PCIC domains
```

## Features (Phase 2 MVP)

- **Event Attendance** (F-001) — Create events, track check-ins by domain
- **Decision Repository** (F-012) — Log and track executive decisions with status timeline
- **Strike System** (F-006) — Search members, assign disciplinary strikes
- **Accelerated Entry** (F-004) — Candidate portfolio upload, president approval
- **Summer project (Batch 1)** — Members upload a PDF; Domain Leaders in the same **domain** pass/fail; pass promotes the student to **Batch 2**. Domains are only: Code Crafters, Turing Tribe, Cyber Crew, Pixel Peeps.
- **Member Management** — Filter, view profiles, change status (triggers email)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/events` | List / create events |
| POST | `/api/events/:id/checkin` | Toggle check-in |
| GET | `/api/members` | List members (filterable) |
| PUT | `/api/members/:id/status` | Change member status |
| GET/POST | `/api/decisions` | List / create decisions (query: category, status, startDate, endDate, checkDate) |
| GET | `/api/decisions/conflicts?date=YYYY-MM-DD` | Decisions (exam/holiday) overlapping date |
| PUT | `/api/decisions/:id` | Update decision (incl. status, dates, actionItems) |
| GET/POST | `/api/strikes` | List / assign strikes |
| GET | `/api/strikes/member/:id` | Member strike history |
| GET/POST | `/api/candidates` | List / submit application |
| PUT | `/api/candidates/:id/approve` | Approve candidate |
| GET | `/api/summer-projects/mine` | Current user’s summer submission for the active cycle (latest) |
| GET | `/api/summer-projects/pending` | Pending submissions in the Domain Leader’s domain |
| POST | `/api/summer-projects` | Batch 1 `member` uploads PDF (`multipart` field `file`) |
| PUT | `/api/summer-projects/:id/grade` | Domain Leader body `{ verdict: "pass"\|"fail", comment? }` — pass sets student to `batch_2` |

## For Contributors

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, branch naming, and PR workflow.

## AI Assistant Context

This project includes configuration for AI coding assistants:

- **Cursor** — Rules in `.cursor/rules/`, skills in `.cursor/skills/`
- **GitHub Copilot** — Instructions in `.github/copilot-instructions.md`
- **Any AI** — `AGENTS.md` at the project root

These files ensure any AI assistant understands the project architecture, tech stack, and conventions.