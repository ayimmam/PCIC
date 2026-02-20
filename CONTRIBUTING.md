# Contributing to PCIC Management System

Welcome to the PCIC Internal Management System project! This guide will get you from zero to your first pull request.

## First-Time Setup

### 1. Clone the repo

```bash
git clone https://github.com/ayimmam/PCIC.git
cd PCIC
```

### 2. Install dependencies

```bash
npm run setup
```

This installs both `client/` and `server/` dependencies in one command.

### 3. Configure your environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with the shared Atlas credentials (ask the team lead for the connection string). The file should look like:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@pcic-cluster.o0hy3tf.mongodb.net/pcic?appName=PCIC-cluster
JWT_SECRET=pick-a-random-secret-string
PORT=5000
```

### 4. Whitelist your IP in Atlas

Go to [MongoDB Atlas](https://cloud.mongodb.com/) → **Network Access** → **Add IP Address** → **Add Current IP Address**. Without this, the server cannot connect to the database.

### 5. Seed test data

```bash
npm run seed
```

This creates test accounts you can log in with (see README for the full list).

### 6. Start development servers

Open **two terminals**:

```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

Open http://localhost:5173 and log in with `president@pcic.com` / `password123`.

## Git Workflow

We use a **feature branch workflow**. Nobody pushes directly to `main`.

### Step-by-step for every task

```bash
# 1. Make sure you're on main and up to date
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Work on your changes, commit often
git add .
git commit -m "feat(module): short description of what you did"

# 4. Push your branch to GitHub
git push -u origin feature/your-feature-name

# 5. Open a Pull Request on GitHub
#    - Go to https://github.com/ayimmam/PCIC/pulls
#    - Click "New pull request"
#    - Select your branch → main
#    - Fill out the PR template
#    - Request a review from a teammate

# 6. After PR is approved and merged, clean up
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

### Branch naming

| Prefix | Use for | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/event-filters` |
| `fix/` | Bug fixes | `fix/login-redirect` |
| `refactor/` | Code cleanup (no behavior change) | `refactor/extract-api-hooks` |
| `docs/` | Documentation only | `docs/update-readme` |

### Commit message format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | Adding new functionality |
| `fix` | Fixing a bug |
| `refactor` | Restructuring code without changing behavior |
| `style` | Formatting, whitespace, missing semicolons |
| `docs` | Documentation changes only |
| `chore` | Dependency updates, config changes |

Examples:
```
feat(events): add domain filter dropdown to event list
fix(auth): redirect to login on expired token
refactor(members): extract MemberFilters into separate component
chore(deps): update mongoose to v8.10
```

## Pull Request Guidelines

- **One feature per PR** — don't bundle unrelated changes
- **Fill out the PR template** — it's there to help reviewers
- **Link related issues** — use `Closes #12` in the PR description
- **Request at least one reviewer** before merging
- **Test locally** before pushing — make sure both servers start and the feature works

## Project Structure

```
client/               React frontend (Vite + JSX)
  src/api/            Axios instance with JWT interceptor
  src/components/     Feature components grouped by module
  src/components/ui/  Shadcn UI primitives — DO NOT edit these
  src/context/        React context (AuthContext)
  src/hooks/          React Query hooks (data fetching)
  src/pages/          Page-level components
  src/lib/            Utility functions

server/               Node.js + Express backend
  src/config/         Database connection
  src/controllers/    Route handlers (business logic)
  src/middleware/     Auth + role guard
  src/models/         Mongoose schemas
  src/routes/         Express route definitions
  src/utils/          Email, file upload helpers
```

## Coding Standards

- **No TypeScript** — all files are `.js` / `.jsx`
- **ES modules** everywhere — use `import`/`export`, not `require`
- **Tailwind CSS** for styling — no CSS modules, no inline styles
- Use `@/` path alias for frontend imports (e.g., `import { Button } from '@/components/ui/button'`)
- **Functional components** only (no class components)
- Use **React Query** for server state, **React Context** for auth state only
- Backend pattern: **routes → controllers → models** (keep them in separate files)
- Always handle errors with `try/catch` and return proper HTTP status codes

## How to Add a New Feature

Follow this checklist whenever you build something new:

1. **Model** — `server/src/models/YourModel.js` (Mongoose schema)
2. **Controller** — `server/src/controllers/yourController.js` (business logic)
3. **Routes** — `server/src/routes/your-routes.js` → mount in `server/src/index.js`
4. **React Query hook** — `client/src/hooks/useYourFeature.js`
5. **Components** — `client/src/components/your-feature/*.jsx`
6. **Page** — `client/src/pages/YourPage.jsx`
7. **Router + nav** — add route and sidebar link in `client/src/App.jsx`

## User Roles (for reference)

`president` > `pm` > `mc` > `domain_leader` > `member`

- Backend: `roleGuard("president", "pm")` middleware restricts endpoints
- Frontend: `<RoleGate allowedRoles={["president", "pm"]}>` hides UI elements

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoNetworkError` / TLS error | Add your IP in Atlas Network Access |
| `bad auth : authentication failed` | Check username/password in `server/.env` matches Atlas Database Access |
| `Cannot find module` | Run `npm run setup` from the project root |
| Port 5000 already in use | Kill the existing process or change `PORT` in `server/.env` |
| Frontend can't reach API | Make sure the backend is running on port 5000 (Vite proxies `/api` to it) |

## Need Help?

- Check the [README](README.md) for an overview of features and API endpoints
- Check [AGENTS.md](AGENTS.md) for AI assistant context
- Open an [issue](https://github.com/ayimmam/PCIC/issues) if you're stuck
