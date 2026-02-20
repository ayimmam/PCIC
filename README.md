# PCIC Internal Management System

Web platform for the **Peak Craft Informatics Community** (PCIC) — digitizing membership tracking, event attendance, leadership decision-making, and disciplinary workflows for 800+ students across IS, CS, and IT departments at Hawassa University.

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

This creates test accounts you can log in with:

| Role | Email | Password |
|------|-------|----------|
| President | president@pcic.com | password123 |
| Project Manager | pm@pcic.com | password123 |
| Membership Coordinator | mc@pcic.com | password123 |
| Domain Leader | tech.lead@pcic.com | password123 |
| Member | abebe@pcic.com | password123 |

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
```

## Features (Phase 2 MVP)

- **Event Attendance** (F-001) — Create events, track check-ins by domain
- **Decision Repository** (F-012) — Log and track executive decisions with status timeline
- **Strike System** (F-006) — Search members, assign disciplinary strikes
- **Accelerated Entry** (F-004) — Candidate portfolio upload, president approval
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
| GET/POST | `/api/decisions` | List / create decisions |
| PUT | `/api/decisions/:id` | Update decision status |
| GET/POST | `/api/strikes` | List / assign strikes |
| GET | `/api/strikes/member/:id` | Member strike history |
| GET/POST | `/api/candidates` | List / submit application |
| PUT | `/api/candidates/:id/approve` | Approve candidate |

## For Contributors

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, branch naming, and PR workflow.

## AI Assistant Context

This project includes configuration for AI coding assistants:

- **Cursor** — Rules in `.cursor/rules/`, skills in `.cursor/skills/`
- **GitHub Copilot** — Instructions in `.github/copilot-instructions.md`
- **Any AI** — `AGENTS.md` at the project root

These files ensure any AI assistant understands the project architecture, tech stack, and conventions.
