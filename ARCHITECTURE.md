# PCIC Architecture & Development Reference

## 1. System Overview
The Peak Craft Informatics Community (PCIC) Management System is a full-stack web application used for managing members, events, leadership decisions, disciplinary strikes, candidate applications, and academic projects.

**Key Design Philosophies:**
- Pure JavaScript (ES Modules) across the stack. No TypeScript.
- Functional React components with hooks.
- Server state managed entirely by React Query on the frontend.
- Strict separation of concerns on the backend (Route -> Controller -> Model).

## 2. Technology Stack

### Frontend (`client/`)
- **Core Framework:** React 18, Vite.
- **Routing:** React Router v6.
- **Data Fetching & State:** TanStack React Query v5, Axios (with JWT interceptors).
- **Styling & UI:** Tailwind CSS, Shadcn UI (Radix primitives), Lucide Icons.
- **Forms & Validation:** `react-hook-form` + `zod`.
- **Notifications:** Sonner toasts.

### Backend (`server/`)
- **Core Framework:** Node.js, Express.js (ES Modules).
- **Database & ODM:** MongoDB with Mongoose.
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs`.
- **File Uploads:** Multer with Cloudinary integration (`multer-storage-cloudinary`).
- **Email:** Nodemailer.
- **Security:** Custom NoSQL injection sanitizer (`sanitize.js`), standard CORS.

---

## 3. Directory Structure & Conventions

### Backend Structure (`server/src/`)
- `index.js`: Application entry point, server setup, middleware registration.
- `routes/`: Express route definitions. All routes are prefixed with `/api/` in `index.js`.
- `controllers/`: Core business logic. Extracts request data, interacts with models, and sends responses.
- `models/`: Mongoose schemas. Models enforce schema-level defaults and validations.
- `middleware/`:
  - `auth.js`: Verifies JWT from the `Authorization: Bearer <token>` header.
  - `roleGuard.js`: Implements RBAC `roleGuard("president", "pm", ...)` to restrict route access.
  - `sanitize.js`: Recursively strips `$` prefixed keys from payloads to prevent NoSQL injection.
- `utils/`: Helpers like `email.js` (Nodemailer config) and `upload.js` (Multer/Cloudinary config).
- `constants/`: Configuration data like PCIC domain names.
- `seed/`: Scripts for populating dummy data and academic calendar configurations.

### Frontend Structure (`client/src/`)
- `App.jsx`: Global routing, layout components (Sidebar, Topbar), and `<ProtectedRoute>` wrapping.
- `api/axios.js`: Centralized Axios instance with a request interceptor for JWT injection and response interceptor for 401 handling.
- `context/AuthContext.jsx`: Context provider tracking current user state and token validation.
- `hooks/`: Feature-grouped React Query hooks (e.g., `useMembers.js`, `useDecisions.js`).
- `components/ui/`: Immutable Shadcn UI primitive components.
- `components/shared/`: Reusable high-level components (`RoleGate`, `PageHeader`, `ProtectedRoute`).
- `components/{feature}/`: Complex, feature-specific composite components (e.g., `EventList`, `MemberTable`).
- `pages/`: Top-level route components that assemble feature components.
- `lib/utils.js`: Common utilities like Tailwind class merging (`cn`).

---

## 4. Core Data Models & Relationships

1. **User**: The central entity representing a member, admin, or leadership figure.
   - Key attributes: `role` (defines permissions), `batch`, `domain`, `status`, `isFlagged`.
2. **Event**: Community activities tracking attendance.
   - Embeds: `attendees` (array of subdocuments linking to `User`).
3. **Decision**: Tracks leadership action items and timelines.
   - Categories: exam-schedule, holiday, stakeholder, etc.
   - Embeds: `timeline` and `actionItems`.
4. **Strike**: Disciplinary record linked to a `User` (assignedBy another `User`).
5. **Candidate**: Application system. Includes references to an existing `User` if it's a promotion request, or handles net-new applications.
6. **Project & SummerProjectSubmission**: Tracks team projects (todos, burndowns, issues, resources) and periodic academic submissions.
7. **LeadershipReport & WeeklyReport**: Progress and accountability documentation mechanisms.
8. **SemesterConfig**: Academic calendar tracking.

---

## 5. Security & Access Control (RBAC)

Access control is not strictly linear; it is feature-specific.
Valid roles: `president`, `vice_president`, `pm` (Product Manager), `secretary`, `domain_leader`, `pr`, `mc` (Membership Coordinator), `event_organizer`, `member`.

**Backend Implementation:**
Protect routes by chaining `auth` and `roleGuard`:
```javascript
router.put("/:id", auth, roleGuard("president", "pm", "mc"), updateMemberProfile);
```

**Frontend Implementation:**
Conditionally render UI using the `<RoleGate>` component or check `user.role` directly:
```jsx
<RoleGate allowedRoles={["president", "pm"]} fallback={<Navigate to="/" />}>
  <AdminDashboard />
</RoleGate>
```

---

## 6. Guidelines for Adding a New Feature

When building a new module, adhere strictly to the following workflow:

1. **Database schema**: Create `server/src/models/NewFeature.js`.
2. **Business logic**: Create `server/src/controllers/newFeatureController.js`. Keep controllers thin if possible.
3. **Routing**: Create `server/src/routes/newFeature.js`, apply `auth` and `roleGuard` middlewares. Mount it in `server/src/index.js` under `/api/new-feature`.
4. **Frontend API integration**: Create `client/src/hooks/useNewFeature.js` defining React Query `useQuery` and `useMutation` hooks.
5. **UI Components**: Build scoped components in `client/src/components/new-feature/`. Use existing Shadcn components from `client/src/components/ui/`.
6. **Page View**: Create the primary view in `client/src/pages/NewFeaturePage.jsx`.
7. **Routing & Navigation**: Add the route in `client/src/App.jsx` and update the `navItems` configuration for the sidebar.

---

## 7. Operational Notes

- **File Uploads**: Administered via Cloudinary. Payloads are processed via Multer in memory or streams, bypassing local disk storage.
- **Academic Calendar**: Critical configurations are tagged with `[Academic Calendar]` in the description. Ensure these are not wiped during database seeding or tests.
- **Domains**: The community operates strictly within four domains: `Code Crafters`, `Turing Tribe`, `Cyber Crew`, `Pixel Peeps`. Always utilize the `isPcicDomain` utility or the centralized constant. Legacy data should be handled via the `migrate:domains` script.
- **No TypeScript**: Do not introduce `.ts` or `.tsx` files. Avoid manual prop-type validation unless functionally required.
- **CORS & Environment Variables**: Ensure `VITE_API_BASE_URL` is set on the frontend. The backend relies heavily on `MONGODB_URI`, `JWT_SECRET`, and `CLOUDINARY_*` keys.
