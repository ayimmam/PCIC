# PCIC Implementation Plan

Planning-only document. Repo: `/home/sda1/Downloads2/PCIC` (branch `deploy/member-polish`). All claims below were re-verified against the working tree on 2026-07-07.

---

## Section 0 — Frontend tree reconciliation (`src/` retired, `client/src/` canonical)

### 0.1 Verified divergence (re-diffed)

`diff -rq src client/src` produces exactly:

| Path | State | Action |
|---|---|---|
| `App.jsx` | client newer: adds `Onboarding` import + `mustResetPassword` hard gate in `AppLayout` | Keep client version; nothing to port back |
| `context/AuthContext.jsx` | client newer: adds `completeOnboarding()` + exposes it in provider value | Keep client version |
| `components/shared/WelcomeDialog.jsx` | client newer: adds `pcic_force_welcome` sessionStorage handling | Keep client version |
| `client/src/pages/Onboarding.jsx` | client-only (commit `2b37edb`) | Keep |
| `src/lib/strikePolicy.js` | root-only, imported nowhere in either tree (grep confirms) | Delete, do not port |
| `src/assets/Project charter/` (8 PDFs) | root-only, untracked in git (`*.pdf` is gitignored; `git ls-files src/assets` shows only `pcic-logo.png`). Charters now come from Cloudinary via `ProjectOverview.jsx` | Delete, do not port |

`src/main.jsx` and `client/src/main.jsx` are byte-identical (PostHog init included). `.env.production` and `client/.env.production` are byte-identical (same `VITE_API_BASE_URL`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`). `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`, `components.json` are identical between root and `client/`. `index.html` differs only in whitespace. **Nothing uniquely valuable lives in root `src/`.**

### 0.2 Deploy-pipeline facts (verified)

- Root `package.json`: `"build": "vite build && cp dist/index.html dist/404.html"` (the 404.html copy is the GH Pages SPA fallback — must be preserved), `"predeploy": "npm run build"`, `"deploy": "gh-pages -d dist"`, `"homepage": "https://pcic.tech/"`. `gh-pages` is a root-only devDependency.
- `public/CNAME` (→ pcic.tech) exists only at root; `client/public/` **does not exist**.
- `client/package.json` quirks that must be fixed during the merge:
  - `"pcic-management-system": "file:.."` — a self-referencing dependency on the root package. This is how `client/src/components/reports/ReportPDFExport.js` currently resolves `jspdf`/`html2canvas`, which client does not declare. Remove the `file:..` dep and add `jspdf`, `html2canvas` (and keep `recharts`, already declared) explicitly — or drop them entirely if the dead report feature is removed (see §3.2).
  - No `gh-pages`, no `build`-time 404 copy.
- `client/vite.config.js` has a dead `/uploads` proxy (local-disk uploads no longer exist — see §3.3); root's does not.
- Backend deploys independently via `server/vercel.json`; unaffected.

### 0.3 Decision: keep `client/` as a subdirectory; root `package.json` becomes a thin delegator

Rationale (vs. promoting `client/` to repo root): the repo root already hosts `server/`, `docs/`, and top-level docs; moving `client/*` up would recreate the exact frontend/backend file soup that caused this duplication, and would churn every frontend path in git history and in `ARCHITECTURE.md` (which already documents `client/` as the frontend home). A thin root wrapper keeps the deploy entry point where contributors expect it (`npm run deploy` from root) with minimal moves.

### 0.4 Step-by-step migration

1. **Freeze & branch.** Create `chore/retire-root-frontend` off `main`. Do one final `diff -rq src client/src` at execution time in case trees shift again.
2. **Prepare `client/` to be buildable for production:**
   - Create `client/public/CNAME` containing `pcic.tech` (move from root `public/CNAME`).
   - Change `client/package.json` `"build"` to `vite build && cp dist/index.html dist/404.html`.
   - Remove `"pcic-management-system": "file:.."`; add `"jspdf"` and `"html2canvas"` at the versions pinned in root `package.json` (`^4.2.1`, `^1.4.1`) — or skip if §3.2 removes the PDF-export chain first (preferred ordering: do §3.2's decision before this step to avoid adding deps you then delete).
   - Remove the dead `/uploads` proxy block from `client/vite.config.js`.
   - Run `npm install` inside `client/` to regenerate `client/package-lock.json` without the self-reference.
3. **Rewrite root `package.json` as a delegator** (keep `"homepage"`, keep `gh-pages` devDep, drop all other deps/devDeps):
   - `"dev": "npm --prefix client run dev"`
   - `"build": "npm --prefix client run build"`
   - `"predeploy": "npm run build"`
   - `"deploy": "gh-pages -d client/dist"`
   - Optionally `"postinstall": "npm --prefix client install"` so a fresh clone works with one `npm install`.
   - Regenerate root `package-lock.json`.
4. **Delete retired root frontend files:** `src/`, `vite.config.js`, `index.html`, `public/`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`, `components.json`, root `.env.production` (client's identical copy is canonical), root `dist/`, and root `.env` if present (untracked). Keep root `node_modules` only if the delegator approach needs `gh-pages` (it does — root retains a minimal lockfile for `gh-pages` alone).
5. **PostHog survival check (explicit):** after step 4, confirm `client/src/main.jsx` still contains the `posthog.init` block guarded by `VITE_POSTHOG_KEY`, and `client/.env.production` still carries the three `VITE_*` vars. `vite build` from `client/` picks up `client/.env.production` automatically. Verify in the built bundle: `grep -l "eu.i.posthog.com" client/dist/assets/*.js`.
6. **Verify deploy:** `npm run build` from root; confirm `client/dist/404.html` and `client/dist/CNAME` exist; `npm run deploy`; spot-check pcic.tech (deep-link a route to exercise the 404 fallback, confirm PostHog events arrive, confirm login against the Vercel API).
7. **Docs:** update `README.md` / `CONTRIBUTING.md` dev instructions (`cd client && npm run dev`), and remove stale references to root `src/`.

All subsequent sections target `client/src/` and `server/src/` only.

---

## Section 1 — Role-based UX audit

Access facts verified from `client/src/App.jsx` (navItems + routes), `<RoleGate>` usages, inline `user?.role` checks, and server `roleGuard` per route.

**Route reachability matrix (frontend):** `/` `/events` `/reports`(Decisions) `/career` — all 9 roles. `/members` — president, vice_president, pm, mc, domain_leader (RoleGate). `/admin` — president, pm, mc (RoleGate). `/leadership-compliance` — nav shown to president/vice_president/domain_leader but **route itself has no RoleGate**. `/projects` — nav shown to pm or batch_2/batch_3 users, **route has no RoleGate**. `/summer-project` — nav for domain_leader/member, **route has no RoleGate**. `/peak-projects` — public.

### Findings table

| # | Role(s) affected | Finding | Why it's a problem | Suggested resolution |
|---|---|---|---|---|
| U1 | member, secretary, pr, event_organizer | `Dashboard.jsx` calls `useMemberCount()` → `GET /members/count`, which is roleGuarded to president/vp/pm/mc/domain_leader. These roles get a silent 403 and the "Total Members", "Active Rate", and Member Status Breakdown cards render 0/0%. | Broken-looking dashboard for 4 of 9 roles; silently swallowed errors. | Role-aware dashboard: gate the leadership stat cards behind the same role list, or (with §2's catalogue) open a limited `/members/count` to all roles. |
| U2 | all leadership except member | `Career.jsx` renders "Request Promotion" buttons (header + hero, twice) for every role, but `CandidateUploadDialog` is only mounted when `user?.role === "member"` (line 109). For the other 8 roles the buttons are no-ops. | Dead-click UI; also duplicated CTA even for members. | Hide both buttons unless `role === "member"`; keep a single CTA. |
| U3 | president, pm, mc | The same `CandidateList` + `CandidateReview` render in **three** places: `Admin.jsx` (Candidates tab), `Career.jsx` (`isAdmin` block), and `Members.jsx` (pending-promotions banner + `CandidateReview`). | Three surfaces for one dataset; divergence risk (e.g. `showActions` logic already duplicated). | Make Career the member-facing surface only; keep the review workflow in Admin (or Members) exactly once; delete the other embeds. |
| U4 | member | `Members.jsx` lines 39–85 build a `memberCandidate` self-service banner for `member` users — but `/members` is RoleGated to leadership, so a `member` can never reach it. Confirmed dead path. | Dead code inside a live page; misleading for maintainers. | Delete the `memberCandidate` block (Career already shows the same status banner), or resurrect it when §2 opens `/members` to all roles. |
| U5 | president, pm, mc | `Admin.jsx` "Settings" tab is a "coming soon" placeholder. | Dead UI shipped to production admins. | Remove the tab until a settings feature exists. |
| U6 | leadership | `MemberFilters.jsx` `STATUSES` omits `suspended`, though `User.status` enum and the strike-flag flow set it. Leadership cannot filter to suspended members — the exact set they most need to review. | Feature gap + inconsistency with the model. | Add `{ value: "suspended", label: "Suspended" }`. |
| U7 | leadership | `MemberDetail.jsx` `statusVariant` map lacks `suspended` (badge renders unstyled), while `ProfileDropdown.jsx` has the complete map, and `batchLabels` is copy-pasted in both. | Inconsistent status rendering for the same entity. | Extract shared `lib/memberDisplay.js` (statusVariant, batchLabels) used by both. |
| U8 | all | Route-level gating is inconsistent: `/members` and `/admin` use `<RoleGate fallback={<Navigate/>}>`, but `/leadership-compliance`, `/projects`, `/summer-project` rely only on nav hiding — any user can deep-link them (backend guards data, but users see empty/erroring shells; e.g. a `secretary` opening `/leadership-compliance` triggers 403s on `GET /leadership-compliance/semesters`). | Inconsistent pattern; confusing error states; nav visibility ≠ authorization. | Wrap all three routes in `RoleGate`/`BatchGate` matching their navItems predicates (this also gives dead `BatchGate.jsx` a purpose — or delete it, §3.1). |
| U9 | all | Mixed authorization idioms: `<RoleGate>` in `Events.jsx`/`Reports.jsx`/`App.jsx` vs. ~20 inline `user?.role === ...` checks (`Career`, `Members`, `MemberTable`, `MemberDetail`, `LeadershipCompliance`, `SummerProject`, all `projects/*`). | Divergent pattern for the same concern; role lists drift (e.g. `MemberTable.isLeader` = p/pm/mc but the page admits vp/domain_leader). | Convention: `RoleGate` for render-gating blocks; a shared `useRole()`/`hasRole(user, ...)` helper for logic-gating. Sweep during §2 work on member views. |
| U10 | all | `Dashboard.jsx` hand-rolls its `<h1>` header while every other page uses `PageHeader`. | Inconsistency. | Use `PageHeader`. |
| U11 | member | Dashboard shows community-wide "Total Strikes"/"Members With Strikes" to plain members (backend `GET /strikes/summary` is auth-only). | Discipline data is arguably leadership-only; also see security S4. | Decide policy; if restricted, gate card + route together. |
| U12 | secretary, pr | These roles have no distinct surface anywhere: no navItem, page, or `roleGuard` names them except the `User` enum and compliance `COMPLIANCE_ROLES` excludes them. They see the generic member experience plus broken dashboard cards (U1). | Roles exist in the model but the product gives them nothing; suggests either missing features or enum bloat. | Product decision to record in the plan: either include them in "leadership" viewers for §2's catalogue and Members page, or explicitly document them as member-equivalent. |
| U13 | leadership | Filter/search UX diverges: Members = search input + 3 selects; Decisions = `DecisionFilters`; Events = tabs + single domain select; Candidates = none. | Same task, four patterns. | Adopt the Members pattern (search + selects) as the house style when touching these pages; add candidate status filter when consolidating U3. |
| U14 | pm | `ProjectOverview.jsx` fetches all members (`useMembers({}, { enabled: isPm })`) just to build team pickers — with 800+ members and no pagination this is the heaviest query in the app fired on every Projects visit. | Performance + UX (giant unfiltered lists). | Depend on §2 pagination/search endpoint; use a searchable async select. |

---

## Section 2 — Comprehensive, searchable member catalogue

### 2.1 Schema (`server/src/models/User.js`)

Add:

```
skillLevel: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "beginner" }
phone:      { type: String, trim: true, default: "" }          // optional
bio:        { type: String, trim: true, maxlength: 300, default: "" }
```

- **Join date:** do NOT add a field — `createdAt` (schema has `timestamps: true`) already serves; expose it as `joinedAt` in API responses. Caveat to flag to owner: for members seeded in bulk (`seed-members.js`), `createdAt` = seeding date, not real join date. If historically accurate join dates matter, an optional `joinedAt` override field is needed — owner decision, not assumed here.
- **Flagged as unconfirmed scope (do not add without owner sign-off):** telegram/GitHub handles, department/year of study, profile photo. Nothing in the existing codebase implies them; inventing them would be speculative.
- Migration: no script needed — enum defaults apply lazily; but for filter correctness run a one-off `updateMany({ skillLevel: { $exists: false } }, { $set: { skillLevel: "beginner" } })` (pattern: `server/src/migrate-legacy-domains.js`).

### 2.2 Skill level: assigned by leadership (recommended), not self-reported

- **Recommendation:** editable by `president`, `pm`, `mc`, `domain_leader` (their own domain's members for domain_leader — enforce `member.domain === req.user.domain` in controller, since `roleGuard` is role-only).
- **Precedent:** status changes are p/pm/mc (`PUT /members/:id/status`), batch changes president-only (`PUT /members/:id/batch`). Self-editing precedent exists only for name/password (`/members/me/*`). A skill level members set themselves would mirror the batch-promotion *request* flow instead — but batch already encodes self-asserted progression with review; a second self-reported axis would be redundant with it.
- **Tradeoffs (document for owner):** leadership-assigned = consistent/credible but adds workload for 800+ members and defaults everyone to "beginner" until touched; self-reported = zero admin cost but noisy and duplicates the batch-progression concept. Middle option if wanted later: member proposes, domain_leader confirms (reuses the Candidate review shape). Plan assumes leadership-assigned.
- **New route:** `PUT /members/:id/skill-level`, `auth, roleGuard("president","pm","mc","domain_leader")`, body `{ skillLevel }` validated against the enum (mirror `updateMemberBatch`'s allowlist style in `memberController.js`).

### 2.3 API (`server/src/routes/members.js`, `server/src/controllers/memberController.js`)

- **"Leadership" definition (verified precedent):** the existing member-read roleGuard is `president, vice_president, pm, mc, domain_leader` (`GET /members`, `GET /members/count`). Use exactly this set as "full-detail viewers". `secretary`, `pr`, `event_organizer` have no member-data access anywhere today (see U12) — keep them on the limited profile unless the owner promotes them; record that as an explicit open question, per U12.
- **Open catalogue to all roles with projection by viewer:** change `GET /members` guard to `auth` only, and in `getMembers` select fields by role:
  - Full viewers: current behavior minus `password` (as now), plus new fields.
  - Limited (`member`, `secretary`, `pr`, `event_organizer`): project only `name role domain batch skillLevel createdAt`. **Excluded for limited viewers:** `email`, `status`, `mustResetPassword`, `isFlagged`, `flagAssignedBy`, `dismissFlagRequested`, and any strike data. Rationale from existing gating: flag/dismiss actions are p/pm/mc-only; status changes are leadership-only; strike history in `MemberDetail` is a leadership surface. (Note: strike endpoints currently leak to everyone — fixing that is security item S4 and is a prerequisite for the "limited profile" promise to be real.)
  - Implement as a `buildMemberProjection(role)` helper in the controller; also apply the limited projection in search (`$or` on `email` must be skipped for limited viewers since they can't see email).
- **Filters:** extend existing query params (`domain`, `batch`, `status`, `search`) with `skillLevel`. `status` filter must be ignored/rejected for limited viewers.
- **Pagination (required — 800+ members, currently returns all):** add `page`/`limit` (default 25, cap 100) with `.skip/.limit/.lean()` and a `total` in the response envelope `{ items, total, page, limit }`. This changes the response shape — update `useMembers` and `MemberTable` consumers in the same PR. Add index: `userSchema.index({ name: 1 })` and `{ domain: 1, batch: 1, status: 1 }`.

### 2.4 UI (extend, don't parallel)

- `client/src/App.jsx`: remove the RoleGate role list from `/members` (all authenticated roles reach it); nav item loses its `roles` array.
- `MemberFilters.jsx`: add Skill Level select (4 enum values + all); hide the Status select for non-full viewers; add `suspended` to STATUSES (U6).
- `MemberTable.jsx`: add Skill Level column; hide Status/Strikes/flag-action columns for limited viewers (reuse a `canViewSensitive = ["president","vice_president","pm","mc","domain_leader"].includes(user?.role)` — export from the shared role helper of U9); wire pagination controls (TanStack Table is already a dependency).
- `MemberDetail.jsx`: add phone/bio/skill level/joined date rows; render strike history + status/batch actions only for full viewers; add "Set Skill Level" action (new small dialog cloning `StatusChangeDialog.jsx`'s shape) for p/pm/mc/domain_leader.
- `useMembers.js`: pass `skillLevel`, `page`, `limit`; keep queryKey `["members", filters]` so pagination pages cache independently.
- Self-service: add bio/phone editing to `ProfileDropdown` via a `PUT /members/me/profile` (extending the existing `/members/me/name` pattern) — phone/bio are member-owned data; skill level is not self-editable.

### 2.5 Sequencing

1. Model fields + migration → 2. projection helper + guard change + pagination on `GET /members` (+ S4 strike-route tightening in the same PR, since opening `/members` to members without fixing strikes widens the leak surface) → 3. skill-level route → 4. frontend filters/table/detail → 5. nav/route opening → 6. U4 banner resurrection or deletion.

---

## Section 3 — Dead code & maintainability

### 3.1 Confirmed-dead frontend files (grep-verified: zero importers)

- `client/src/components/strikes/StrikeSearch.jsx` — delete.
- `client/src/components/shared/BatchGate.jsx` — delete **or** use for U8's `/projects` route gating; decide with U8, don't leave dangling.
- `client/src/components/shared/ConfirmDialog.jsx` — delete (dialogs are hand-rolled per feature; if standardizing, adopt it deliberately instead).
- Root-tree dead code (`src/lib/strikePolicy.js`, charter PDFs) — handled by Section 0.

### 3.2 Unreachable feature: report generation chain

`client/src/pages/GenerateReport.jsx` is imported nowhere and has no route in `App.jsx`. Its entire dependency chain is therefore unreachable from the UI: `components/reports/ReportGenerator.jsx`, `ReportPreview.jsx`, `ReportCharts.jsx`, `ReportPDFExport.js`, `hooks/useReports.js`, plus backend `server/src/routes/reports.js` + `reportController.js` (181 lines) mounted at `/api/reports` (president/vp only). The branch `feature/auto-generate-report` exists, so this looks like an unfinished merge rather than trash. **Decision required, with a default:** either (a) wire a route `/generate-report` behind `RoleGate ["president","vice_president"]` and add a navItem, or (b) remove the whole chain and the now-unused deps `recharts`, `jspdf`, `html2canvas` (which also simplifies §0.4 step 2). Recommend (a) only if the owner confirms the feature is wanted; otherwise (b) — the code can be recovered from the feature branch.

### 3.3 Local uploads leftovers

- Verified: no server code reads or writes local disk (`grep fs\.\|uploads` across `server/src` hits only Cloudinary folder names and placeholder `fileUrl` strings in `seed.js`). `server/uploads/*.pdf` files are untracked (`*.pdf` gitignored).
- Actions: delete `server/uploads/` directory; remove the `/uploads` proxy from `client/vite.config.js` (folded into §0.4); optionally update `seed.js` placeholder `fileUrl`s (`"uploads/seed-*.pdf"`) to obviously-fake `https://example.invalid/...` URLs so no one reintroduces a local-path assumption.

### 3.4 Duplicated logic to extract

| Duplication | Locations | Extraction |
|---|---|---|
| `const { password: _, ...userData } = user.toObject()` | authController (×3), memberController (×4) | `server/src/utils/toSafeUser.js` |
| `try { ... } catch (error) { res.status(500).json({ message: error.message }) }` | every controller function (~40×) | `asyncHandler` wrapper + central error middleware (also security fix S6) |
| Multer error-wrapping inline middleware | `routes/leadership-compliance.js`, `routes/summer-projects.js` (identical shape) | `handleUpload(uploader, field)` helper in `utils/upload.js` |
| `summerPdfFilter` vs `leadershipPdfFilter` (identical bodies) | `utils/upload.js` | single `pdfOnlyFilter` (superseded anyway by S2's content validation) |
| `myApplication`/`memberCandidate` find over candidates | `Career.jsx` L19-22, `Members.jsx` L39-42 | `useMyCandidate()` in `hooks/useCandidates.js` (or deleted with U4) |
| `statusVariant`/`batchLabels` maps | `MemberDetail.jsx`, `ProfileDropdown.jsx` (divergent, see U7) | `client/src/lib/memberDisplay.js` |
| Status count queries | `memberController.getMemberCount` (4 sequential awaits), `reportController` (same counts via `Promise.all`) | one aggregation (`$group` on status) shared or at least `Promise.all` in `getMemberCount` |

### 3.5 Performance flags (not a deep pass)

- `GET /members` unpaginated over 800+ users — fixed by §2.3.
- `Members.jsx` fetches **all** strikes (`useStrikes()` → `GET /strikes`, fully populated) just to compute per-member counts client-side. Replace with a server aggregation (`GET /strikes/counts` → `{ memberId: count }`) or fold counts into the paginated members response.
- `getMemberCount`: 4 sequential `countDocuments` → single aggregation (above).
- `Dashboard.jsx` uses `useMemberStrikes(user?._id)` while `ProfileDropdown` uses `useMyStrikes()` — two endpoints/caches for the same data; standardize on `/members/me/strikes`.
- `eventController.getEventCount` runs 4 sequential queries + an aggregate; wrap in `Promise.all`.
- `.lean()` on read-only list queries (members, strikes, events lists) — cheap win.

---

## Section 4 — Security audit (ranked)

### S1 — HIGH: no rate limiting on `/api/auth/login`

- **What:** `express-rate-limit` is installed and already used for public comments (`routes/peak-projects.js`), but `routes/auth.js` applies none. Unlimited online brute force against 800+ accounts — made worse by S3's shared temp password.
- **Exploit:** attacker scripts POST `/api/auth/login` with the known roster email format and a password list; nothing throttles it.
- **Fix:** in `server/src/routes/auth.js`, add `loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, standardHeaders: true, legacyHeaders: false, message: {...} })` on `POST /login` (mirror the peak-projects limiter style). Add a stricter one on `POST /complete-onboarding` too. **Caveat to document:** on Vercel serverless the default in-memory store resets per instance/cold start, so this is best-effort throttling, not a hard guarantee; acceptable for this threat model, but note it. Consider `keyGenerator` combining IP + normalized email to slow per-account spraying.

### S2 — HIGH: extension-only upload validation (`server/src/utils/upload.js`)

- **What:** all three Multer configs filter on `path.extname(file.originalname)` only. Content is never inspected; `CloudinaryStorage` streams whatever arrives with `resource_type: "auto"`.
- **Exploit:** upload `payload.html` renamed `portfolio.pdf` via `POST /api/candidates` (any member). Cloudinary stores and serves it; `PortfolioPreview.jsx` links/embeds the URL for the president during review → stored-XSS-adjacent phishing against the highest-privilege user; also SVG-with-script via the image path in the generic uploader.
- **Fix (compatible with existing stack):** Multer's `fileFilter` cannot see content, so switch the validated routes to `multer.memoryStorage()` (files are ≤10 MB, fine in memory on Vercel), then in a small `validateAndUploadToCloudinary(buffer, opts)` helper: check magic bytes (`%PDF-` prefix for PDFs; PNG/JPEG/GIF signatures for images — either hand-rolled or the `file-type` package), reject mismatches, then stream to Cloudinary with `cloudinary.uploader.upload_stream({ folder: "pcic-uploads", resource_type: "image"|"raw" as appropriate — stop using "auto" })`. Update the three consumers (`routes/candidates.js`, `routes/summer-projects.js`, `routes/leadership-compliance.js`) to use the helper; keep existing size limits and the per-route error wrapping (consolidated per §3.4). Bonus fix: in `leadership-compliance.js`, the upload middleware runs **before** the controller's `domain_leader` check, so any authenticated user's file reaches Cloudinary before the 403 — add `roleGuard("domain_leader")` ahead of the upload middleware.

### S3 — HIGH: shared, committed temporary password

- **What:** `server/src/seed-members.js` hardcodes `TEMP_PASSWORD = "PcicWelcome2026"` for every new account, prints it to console, and it's committed to git history. Every not-yet-onboarded account is accessible with one known credential.
- **Exploit:** anyone with repo access (or the roster + the guessable pattern) logs into any account still flagged `mustResetPassword` and completes onboarding as the victim — full account takeover, silent because the victim simply "can't log in" later.
- **Fix:** generate a per-user random temp password (`crypto.randomBytes`) in `seed-members.js`; output an operator-only CSV mapping (never committed — extend `.gitignore`), or better, email each temp password individually via the existing Nodemailer setup (`utils/email.js` — currently has no credential-delivery function; add `sendTempPasswordEmail`). Rotate/expire: since `mustResetPassword` accounts are the exposure window, add an expiry (e.g. reject logins where `mustResetPassword && createdAt < now - 14d`) or run a cleanup script. Also purge the literal from the repo going forward (history rewrite optional; at minimum change the pattern so history knowledge is useless).

### S4 — MEDIUM-HIGH: over-broad authenticated read access (authorization gaps)

Verified route-by-route:
- `GET /api/strikes` (all strikes, populated with member name+email), `GET /api/strikes/summary`, `GET /api/strikes/member/:id` — **auth only, no roleGuard**. Any plain member can enumerate everyone's disciplinary history.
- `GET /api/candidates` — auth only. Any member reads all applicants' emails, motivations, portfolio URLs, review comments.
- `PUT /api/projects/:id/repo`, `POST/PUT .../todos` — auth only; any member can edit any project's repo URL/todos (controller does not scope to team membership — verify at implementation time, `projectController.js`).
- `PUT /api/decisions/:id` — auth only, but the controller correctly branches: non-admins can only mark their own action items "done" (verified lines 187–243). Acceptable; document as intentional.
- **Fix:** add `roleGuard("president","vice_president","pm","mc","domain_leader")` to `GET /strikes` and `GET /strikes/summary`; make `GET /strikes/member/:id` self-or-leadership (compare `req.params.id` with `req.user._id`); restrict `GET /candidates` to leadership + filter to own application for members (Career.jsx only needs the caller's own candidate — add `GET /candidates/mine`); scope project todo/repo mutations to team members or pm. Frontend follow-ups: Dashboard strike-summary card (U11), Members strike counts (§3.5), Career `useMyCandidate` switch to `/candidates/mine`.

### S5 — MEDIUM: JWT lifecycle (7-day flat expiry, no revocation)

- **What:** `authController.generateToken` signs `{ id }` for 7d; logout is client-side only (`AuthContext.logout` clears localStorage); a stolen token works for up to 7 days even after password change.
- **Assessment (proportionate):** internal community tool, Bearer-token-in-localStorage SPA, serverless backend where a session store (Redis) would be new infrastructure. A full refresh-token rotation scheme is over-engineering here. The real gap is that **password change/reset does not invalidate old tokens** — which matters precisely in the S3 takeover scenario.
- **Fix:** add `passwordChangedAt` to `User` (set in the existing `pre("save")` hook when `isModified("password")`); in `middleware/auth.js`, reject tokens whose `iat * 1000 < passwordChangedAt` (one extra field on the already-fetched user, no new storage). Optionally shorten expiry to 72h (login weekly is acceptable for this audience). Document explicitly that logout remains client-side and why.

### S6 — MEDIUM: raw `error.message` returned to clients

- **What:** ~40 catch blocks across all controllers return `res.status(500).json({ message: error.message })`. Mongoose CastErrors/ValidationErrors leak schema internals, and driver errors can leak topology details.
- **Fix:** central Express error middleware in `server/src/index.js` (after routes): log full error server-side; respond 500 with generic message; map known cases (CastError→400, 11000→409) deliberately. Pair with §3.4's `asyncHandler` so controllers just `throw`.

### S7 — MEDIUM: sanitize middleware gaps (`server/src/middleware/sanitize.js`)

- Verified applied globally in `index.js` **before** all routers — good — but three gaps:
  1. **Multipart bodies bypass it entirely:** for upload routes, Multer populates `req.body` *after* the global sanitize already ran on an empty body. Fields like `motivation` (candidates) and `reportTitle` (compliance) are unsanitized. Fix: re-run `stripDollarKeys` on `req.body` in the shared `handleUpload` helper (§3.4) after Multer, or as route-level middleware after the uploader.
  2. **Keys containing `.`** are not stripped — Mongo dot-notation injection into update paths if any controller ever spreads `req.body` into an update (none do today, but cheap to also strip/replace `.`-keys).
  3. **`__proto__`/`constructor` keys** are copied into the fresh `cleaned` object (`cleaned[key] = ...`), a latent prototype-pollution vector; skip these keys too.

### S8 — LOW-MEDIUM: security headers + CORS

- No `helmet`. For a pure JSON API the win is modest but real: add `helmet()` with defaults (X-Content-Type-Options, HSTS behind Vercel, etc.); disable CSP (irrelevant for API) to avoid surprises. One dependency, two lines in `index.js`.
- CORS (`index.js`): origin allowlist is fine; `credentials: true` is unnecessary (auth is Bearer-header, no cookies) — drop it to shrink the surface. Note `CORS_ORIGIN` env is a single string while the fallback is an array; support comma-separated parsing if the env path is ever used.

### S9 — LOW: onboarding/password policy details

- `completeOnboarding` keeps only the first word of the submitted full name (`split(/\s+/)[0]`) — surprising data loss, not security per se; store the full trimmed name (fix alongside §2).
- 6-char minimum password (model + both controllers + Onboarding UI) — raise to 8 in all four places.
- Uniform "Invalid email or password" on login (good — no user enumeration). Keep it that way when adding the limiter message.
- JWT in localStorage: known XSS-exfiltration tradeoff; acceptable for this app, but S2's upload fix and Shadcn's escaped rendering are the compensating controls — document, don't rebuild around cookies.
- `.env.production` PostHog key is public-by-design (client bundle) — fine; ensure `server/.env` never lands in git (only `server/.env.example` is tracked — verified).

### Suggested execution order for Section 4

S1 + S3 together (same threat), then S4 (route guards — coordinate with §2.3), S2 (upload rework), S6+S7 (middleware refactor, pairs with §3.4), S5, S8, S9.

---

## Cross-section sequencing summary

1. **Section 0** migration (unblocks everything; do §3.2's keep-or-kill decision first to settle client deps).
2. **S1/S3** quick security wins (independent of frontend).
3. **Section 2** backend (schema, projection, pagination) **with S4** in the same change set.
4. **Section 2** frontend + the member-view UX fixes it subsumes (U4, U6, U7, U14).
5. Remaining **Section 1** fixes (U1–U3, U5, U8–U13) as small PRs.
6. **Section 3** extractions + **S6/S7** error/sanitize middleware as one backend-hygiene PR; S2 upload rework; S5, S8, S9 to close.

### Critical Files for Implementation
- /home/sda1/Downloads2/PCIC/package.json (and /home/sda1/Downloads2/PCIC/client/package.json) — deploy retarget, §0
- /home/sda1/Downloads2/PCIC/server/src/models/User.js — catalogue schema, §2
- /home/sda1/Downloads2/PCIC/server/src/controllers/memberController.js (with server/src/routes/members.js) — projection, pagination, skill-level, §2/S4
- /home/sda1/Downloads2/PCIC/server/src/routes/auth.js (with server/src/controllers/authController.js) — rate limiting, token lifecycle, onboarding, S1/S3/S5
- /home/sda1/Downloads2/PCIC/server/src/utils/upload.js — content-based upload validation, S2
