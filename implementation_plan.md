# Project Metric Log Feature

Add a new **Project Metric Log** tab to the sidebar — visible to **batch 2 & 3 members + PM** — that provides a full project tracking dashboard: artifacts, burndown charts, issue threads, resources, a todo sidebar, quality scoring, and calendar-integrated deadlines.

## Proposed Changes

### Backend — New Models

Four new Mongoose models following the existing pattern.

#### [NEW] [Project.js](file:///home/sda1/Downloads2/PCIC/server/src/models/Project.js)

Core project model:

```js
{
  title: String,           // required
  description: String,     // project charter text
  repoUrl: String,         // set by projectLead
  deadline: Date,          // planned delivery date (~2.5 months out)
  projectLead: ObjectId,   // ref User — a batch 2/3 member
  members: [ObjectId],     // ref User — manually assigned by PM
  createdBy: ObjectId,     // ref User — PM who created the project
  status: enum["active","completed","on_hold"],
  // Embedded WBS / todo items:
  todos: [{
    task: String,
    assignee: ObjectId,      // ref User
    status: enum["pending","in_progress","done"],
    isWBS: Boolean,          // true = initial WBS task
    createdBy: ObjectId,
    completedAt: Date,
    createdAt: Date
  }]
}
```

#### [NEW] [WeeklyReport.js](file:///home/sda1/Downloads2/PCIC/server/src/models/WeeklyReport.js)

```js
{
  project: ObjectId,       // ref Project
  weekNumber: Number,
  summary: String,
  submittedBy: ObjectId,   // ref User (project lead or member)
  qualityScore: Number,    // 1-10, set by PM (null until scored)
  scoredBy: ObjectId,      // ref User (PM)
  timestamps: true
}
```

#### [NEW] [ProjectResource.js](file:///home/sda1/Downloads2/PCIC/server/src/models/ProjectResource.js)

```js
{
  project: ObjectId,
  title: String,
  url: String,             // link to article/template/resource
  sharedBy: ObjectId,      // ref User (PM)
  timestamps: true
}
```

#### [NEW] [ProjectIssue.js](file:///home/sda1/Downloads2/PCIC/server/src/models/ProjectIssue.js)

```js
{
  project: ObjectId,
  subject: String,
  status: enum["open","resolved"],
  createdBy: ObjectId,
  messages: [{
    sender: ObjectId,      // ref User
    content: String,
    createdAt: Date
  }]
}
```

---

### Backend — Controller & Routes

#### [NEW] [projectController.js](file:///home/sda1/Downloads2/PCIC/server/src/controllers/projectController.js)

Endpoints:

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/projects` | auth | PM gets all; members get their assigned projects |
| `GET` | `/api/projects/:id` | auth | Project detail (members must be assigned) |
| `POST` | `/api/projects` | PM only | Create project with WBS todos |
| `PUT` | `/api/projects/:id` | PM only | Update project metadata, assign members |
| `PUT` | `/api/projects/:id/repo` | auth | Project lead sets repo URL |
| **Todos** | | |
| `POST` | `/api/projects/:id/todos` | auth (team) | Add todo item |
| `PUT` | `/api/projects/:id/todos/:todoId` | auth (team) | Update todo status |
| **Reports** | | |
| `GET` | `/api/projects/:id/reports` | auth (team) | List weekly reports |
| `POST` | `/api/projects/:id/reports` | auth (team) | Submit weekly report |
| `PUT` | `/api/projects/:id/reports/:reportId/score` | PM only | Attach quality score |
| **Resources** | | |
| `GET` | `/api/projects/:id/resources` | auth (team) | List resources |
| `POST` | `/api/projects/:id/resources` | PM only | Share resource |
| **Issues** | | |
| `GET` | `/api/projects/:id/issues` | auth (team+PM) | List issues |
| `POST` | `/api/projects/:id/issues` | auth (team) | Create issue |
| `POST` | `/api/projects/:id/issues/:issueId/reply` | auth (team+PM) | Reply to issue |
| **Burndown** | | |
| `GET` | `/api/projects/:id/burndown` | auth | Computed from todo completion dates |
| `GET` | `/api/projects/burndown-summary` | PM only | All projects burndown for PM dashboard |

#### [NEW] [projects.js](file:///home/sda1/Downloads2/PCIC/server/src/routes/projects.js)

Route definitions using [auth](file:///home/sda1/Downloads2/PCIC/server/src/middleware/auth.js#4-25) + [roleGuard](file:///home/sda1/Downloads2/PCIC/server/src/middleware/roleGuard.js#1-14) middleware, mounted in [index.js](file:///home/sda1/Downloads2/PCIC/server/src/index.js) as `/api/projects`.

---

### Backend — Existing File Changes

#### [index.js](file:///home/sda1/Downloads2/PCIC/server/src/index.js)

- Import and mount `projectRoutes` at `/api/projects`

---

### Frontend — New Hook

#### [NEW] [useProjects.js](file:///home/sda1/Downloads2/PCIC/client/src/hooks/useProjects.js)

React Query hooks: `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useProjectTodos`, `useAddTodo`, `useUpdateTodo`, `useWeeklyReports`, `useSubmitReport`, `useScoreReport`, `useProjectResources`, `useAddResource`, `useProjectIssues`, `useCreateIssue`, `useReplyIssue`, `useBurndown`, `useBurndownSummary`.

---

### Frontend — New Components

#### [NEW] `client/src/components/projects/` directory

| Component | Description |
|-----------|-------------|
| `ProjectSelector.jsx` | Dropdown to pick project (PM sees all, members see theirs) |
| `ProjectOverview.jsx` | Charter, team members, time-left countdown, repo link button |
| `ProjectBurndown.jsx` | Burndown chart using `recharts` (`LineChart`) — team view shows individual progress; PM view has project dropdown filter |
| `WeeklyReportList.jsx` | List of reports + quality score badges; PM can score |
| `ProjectResources.jsx` | Resource list + PM-only "Share Resource" form |
| `ProjectIssues.jsx` | Issue threads with reply text box |
| `ProjectTodoSidebar.jsx` | Right sidebar — todo list per project, any team member can add |
| `CreateProjectDialog.jsx` | PM-only dialog to create a project with WBS tasks and assign members |

#### [NEW] [BatchGate.jsx](file:///home/sda1/Downloads2/PCIC/client/src/components/shared/BatchGate.jsx)

Like [RoleGate](file:///home/sda1/Downloads2/PCIC/client/src/components/shared/RoleGate.jsx#3-12) but checks `user.batch` and/or `user.role`:

```jsx
// Renders children if user.batch is in allowedBatches OR user.role is in allowedRoles
export default function BatchGate({ allowedBatches, allowedRoles, children, fallback = null }) {
  const { user } = useAuth();
  const batchOk = allowedBatches?.includes(user?.batch);
  const roleOk = allowedRoles?.includes(user?.role);
  if (!batchOk && !roleOk) return fallback;
  return children;
}
```

---

### Frontend — New Page

#### [NEW] [ProjectMetricLog.jsx](file:///home/sda1/Downloads2/PCIC/client/src/pages/ProjectMetricLog.jsx)

Layout:

```
┌─────────────────────────────────────────────────────┬──────────────┐
│  PageHeader: "Project Metric Log"  [🔗 Repo Link]  │              │
├─────────────────────────────────────────────────────┤  Todo List   │
│  [ProjectSelector dropdown]                         │  Sidebar     │
│                                                     │  (per-proj)  │
│  Tabs: Overview | Reports | Burndown | Resources |  │              │
│        Issues                                       │              │
│                                                     │              │
│  (Tab content area)                                 │              │
└─────────────────────────────────────────────────────┴──────────────┘
```

---

### Frontend — Existing File Changes

#### [App.jsx](file:///home/sda1/Downloads2/PCIC/client/src/App.jsx)

- Add `ProjectMetricLog` to imports
- Add nav item with `BatchGate` logic: `{ path: "/projects", label: "Projects", icon: FolderKanban, batches: ["batch_2", "batch_3"], roles: ["pm"] }`
- Add `<Route path="/projects" element={<ProjectMetricLog />} />`
- Update sidebar rendering to check `item.batches` in addition to `item.roles`

#### [ScheduleCalendar.jsx](file:///home/sda1/Downloads2/PCIC/client/src/components/decisions/ScheduleCalendar.jsx)

- Fetch projects via `useProjects` and display project deadlines on calendar days with a distinct color tag (e.g. green)

---

### New Dependency

#### [package.json](file:///home/sda1/Downloads2/PCIC/client/package.json)

- Add `recharts` (`^2.15.0`) for the burndown chart

---

### Seed Data

#### [seed.js](file:///home/sda1/Downloads2/PCIC/server/src/seed.js)

- Add sample projects with WBS todos, weekly reports, resources, and issues for testing

---

## Verification Plan

### Build Verification

```bash
# Server starts without errors
cd /home/sda1/Downloads2/PCIC/server && npm run dev
# Client builds successfully
cd /home/sda1/Downloads2/PCIC/client && npm run build
```

### Seed & API Verification

```bash
cd /home/sda1/Downloads2/PCIC/server && npm run seed
```

Then test API endpoints with `curl`:
- `GET /api/projects` — returns seeded projects
- `POST /api/projects/:id/todos` — adds a todo
- `GET /api/projects/:id/burndown` — returns burndown data

### Browser Verification

Use browser tools to verify:

1. **Login as PM** (`pm@pcic.com`) → "Projects" tab visible in sidebar → can create projects, assign members, share resources, score reports, see all-projects burndown dropdown
2. **Login as batch 2 member** (`abebe@pcic.com`) → "Projects" tab visible → can see assigned project, add todos, submit reports, create issues
3. **Login as batch 1 member** (`sara@pcic.com`) → "Projects" tab **not** visible
4. **Check calendar** → project deadlines appear on the Schedule view
5. **Todo sidebar** → right panel shows per-project todos, any team member can add
6. **Issue thread** → member sends issue, PM replies, thread visible to both
7. **Burndown chart** → renders with ideal vs actual lines, PM dropdown filters by project

> [!IMPORTANT]
> No existing unit tests in the project — verification is build + seed + browser-based. I can also write a simple API test script if you'd prefer automated endpoint checking.
