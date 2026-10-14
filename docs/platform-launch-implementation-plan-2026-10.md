# PCIC platform security, signup, event and public website plan

Planning date: October 13, 2026. Implementation and live verification are tracked in [the October 14 status report](platform-launch-status-2026-10-14.md). The evidence and limits below describe the planning baseline.

This document is based on the current repository and the user's clarified requirements. It supersedes conflicting recommendations in the July `pcic-implementation-plan.md` for this scope. No production audit, dependency advisory scan, deployment, or database modification has been performed.

## 1. Confirmed requirements

- Any student may sign up with any email address; approval and member access are immediate. RSVP requires a signed-in member account.
- Peak staff scan each attendee's individual QR ticket. Members cannot self-check in.
- Showcase capacity is 200 confirmed reservations. No walk-ins and no over-capacity override.
- Public club homepage: `https://pcic.tech/`.
- Login and signup share `https://pcic.tech/login`, with a mode switch.
- Signed-in dashboard: `https://pcic.tech/dashboard`. Existing feature paths remain available.
- Keep React 18/JSX, Vite, Tailwind, Shadcn, React Router, React Query, Express ES modules, Mongoose and MongoDB. Keep GitHub Pages frontend hosting, Vercel API hosting, and Cloudinary media storage.
- Use the annual report for landing-page content, authentic photographs, and Peak branding. Prioritize fast mobile loading.

### Event record

| Field | Value |
| --- | --- |
| Title | PeakCraft Project Showcase & Semester Kick-Off |
| Audience | 2nd- and 3rd-year Informatics students |
| Ethiopian date | Friday, 6/02/2019 E.C. |
| Gregorian date | Friday, October 16, 2026 |
| Local time | 7:30–10:30 LT; 1:30–4:30 PM East Africa Time |
| Time zone | Africa/Addis_Ababa |
| Stored start/end | `2026-10-16T10:30:00.000Z` / `2026-10-16T13:30:00.000Z` |
| Venue | IoT Hall, 003 |
| Capacity | 200 reservations |
| Channel | https://t.me/peakcraftcommunity |
| Suggested slug | `project-showcase-semester-kickoff-2026` |

Preserve the supplied announcement in the event description. Display both calendars and explicit afternoon times. Never derive event time from a visitor's browser time zone.

Implementation defaults: RSVP closes when the event starts; check-in opens 30 minutes before start and closes at event end. Cancellation is allowed before RSVP closes, releasing a seat; no waiting list in this release. These are proposed defaults, not additional user decisions. Academic year is a self-declared event eligibility field; it must not be inferred from club batch. Existing members without this field supply it when reserving. General signup remains available to other students.

## 2. Current evidence and priority

| Priority | Current code evidence | Planned change |
| --- | --- | --- |
| P0 | `routes/auth.js` protects `/register` behind president/PM access; no public signup UI | Add a separate public signup endpoint. Keep privileged registration protected. |
| P0 | `middleware/auth.js` checks JWT and user existence, but not account restrictions or unfinished onboarding | Enforce suspended/inactive account restrictions and an onboarding API allowlist. Keep account recovery available. |
| P0 | Strike read routes and controllers return other members' disciplinary details to authenticated callers | Restrict leadership reads; retain scoped personal reads. Audit every resource for equivalent ownership gaps before enabling open signup. |
| P0 | Event list populates every attendee's name/email for all signed-in users | Return summary data plus the caller's reservation; put roster data behind staff authorization. |
| P0 | `checkinEvent` permits self-check-in, has no time window, can toggle attendance, and saves a previously read document | Replace with explicit RSVP and atomic staff-only QR redemption. Remove the legacy bypass for ticketed events. |
| P0 | Capacity is based on checked-in count; there is no reservation state | Reserve seats at RSVP time with concurrency-safe capacity enforcement. |
| P0 | Event team can manage attendance, but its member search calls a route that excludes `event_organizer` | Supply an event-scoped staff roster endpoint; avoid granting broad member-directory access. |
| P1 | JWTs last seven days, are stored in localStorage, and logout only clears browser data | Introduce revocable sessions, password-change invalidation, and a staged token-storage improvement. |
| P1 | Upload filters in `utils/upload.js` inspect extensions; compliance upload occurs before controller authorization | Authorize before upload, inspect content, restrict delivery, and bound memory/body sizes. |
| P1 | Controllers expose raw errors; validation is inconsistent; login throttling uses instance memory | Add centralized safe errors, request schemas, and shared throttling suitable for Vercel. |
| P1 | Event/member lists are unpaginated; events populate all attendees; `App.jsx` eagerly imports every page | Add projections, pagination, indexes and lazy route loading. |
| P1 | Dashboard currently occupies `/`; login defaults back to `/`; Pages build copies the SPA into `404.html` | Move dashboard to `/dashboard`, preserve return paths, and generate real HTML entries for public/auth routes. |

Previously fixed items must remain fixed: login throttling exists, seeded member passwords are generated individually, and inspected project repo/todo mutations have controller-level ownership checks. Do not repeat the July plan's outdated claims about these areas.

Audit candidates, reports, projects, decisions, uploads and public comments in full during implementation. Route guards alone are insufficient evidence of a defect when controllers may enforce ownership.

## 3. Security work before open signup

### Authorization and data exposure

1. Create a feature-specific access matrix for every API method, covering anonymous users, ordinary members, each leadership role, account status, onboarding status and resource ownership.
2. Enforce the matrix in backend middleware/controllers; align frontend guards and queries with it. New signup must never expand access to private applications, discipline, leadership reports or unrelated projects.
3. Use allowlisted request and response fields. Public signup always assigns `role: member`, `batch: batch_1`, and active status server-side. Ignore or reject submitted privilege fields. Students select one of the four existing domains.
4. Scope event scanner access to event-assigned staff. Proposed assigners: president and event organizer. Eligible staff can be selected from existing leadership accounts; do not introduce a new global role or grant scanner access to all members.
5. Hide attendee emails from public/member event payloads. Scanner responses contain only the identity and attendance information staff need.
6. Review all populated documents and raw `res.json(user)` responses for password hashes, internal flags and excessive personal data. Make password exclusion the schema default and explicitly select it only for password verification.

### Authentication and account lifecycle

- Normalize emails consistently; validate strings, lengths, identifiers and enum values before database calls. Preserve full names.
- Use a passphrase-friendly password policy across signup, onboarding, password change and reset. Proposed minimum: 15 characters without MFA; handle bcrypt's 72-byte limit explicitly rather than silently truncating passwords.
- Add a session identifier to JWTs and a MongoDB session record with expiry and revocation. Logout revokes the current session; password change/reset revokes existing sessions. Validate issuer, audience, algorithm and expiry explicitly.
- Initial compatibility release may retain Bearer transport while fixing revocation and restricting analytics. Move access tokens out of persistent localStorage in the following hardening release: short-lived access tokens in memory and a rotating HttpOnly refresh cookie on a same-site API custom domain such as `api.pcic.tech`, hosted on the existing Vercel deployment. This step needs DNS access and CSRF/origin protection; do not assume cookies to `vercel.app` will work reliably across sites. Keep the existing API URL working during cutover.
- Add password recovery through Nodemailer with single-use hashed tokens, expiry, throttling and generic responses. Any-email signup does not prove email ownership. Do not merge an existing account or transfer its RSVP based on a matching unverified email. Optional verification messaging must not block the user's requested immediate access.
- Store account and IP throttle counters centrally, using MongoDB atomic operations with expiry or a supported shared store. Enforce expiry in queries, not just TTL cleanup. Configure proxy/IP handling from the actual Vercel request path; test rotating-email and multi-instance attempts.
- Preserve existing random seed credentials; expire/reissue outstanding unsafe historical credentials only after inventory. Never print credentials into routine logs.

OWASP's [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) inform the password and revocation work.

### Validation, uploads and operations

- Add backend schema validation for JSON, query strings, params and multipart fields; deny MongoDB operator keys and prototype-sensitive keys. Validate multipart fields after parsing. Sanitization must not substitute for schemas.
- Add generic centralized errors with request IDs; map validation, duplicate, authentication and not-found errors deliberately. Keep secrets and personal payloads out of logs.
- Add API security headers, exact origin allowlists, body-size limits, fail-fast configuration validation and readiness checks. Await a shared MongoDB connection promise before dependent requests; distinguish connection failures from invalid credentials.
- Check upload permission before accepting bytes. Validate extension, declared type, signature and decodability where appropriate; signatures alone do not prove a file safe. Use bounded buffers or signed uploads to a restricted staging area, respecting Vercel's actual request limits before choosing the transport. Existing 10 MB Multer limits do not establish that the hosting platform accepts 10 MB requests.
- Public club media and private portfolios/reports need separate delivery policies. Publish only curated landing assets; use authorized/signed delivery for sensitive documents. Keep Cloudinary secrets server-side, constrain transformations, and remove orphaned uploads.
- Run dependency/advisory and secret scans against root, client and server lockfiles; triage reachable production issues and upgrade compatible patches first. Inspect git history for exposed secrets without printing them. Rotate verified exposures. Do not use blind forced upgrades.

Upload controls follow [OWASP's layered upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## 4. Signup and navigation implementation

### User journey

`Public homepage → event details → RSVP → /login (sign in or sign up) → return to event → reserve seat → show QR ticket → staff scan → checked-in confirmation`.

Signup creates the account and session immediately, but does not silently book a seat. The member explicitly confirms RSVP after authentication. When the event is full, account creation still succeeds and the reservation screen explains that no seat is available.

### Changes

- `server/src/routes/auth.js`, `controllers/authController.js`, `models/User.js`: separate public signup, schemas, safe default privileges, normalized unique email handling, session lifecycle and recovery.
- `client/src/pages/Login.jsx`: accessible sign-in/signup tabs at `/login`, with `?mode=signup` usable in links. Use react-hook-form + zod, inline errors, password visibility and pending states.
- `AuthContext.jsx`, `api/axios.js`: signup/session support, coordinated auth expiry, and no global redirect for ordinary invalid-password errors on the login form. Clear React Query's user-specific cache on logout or account switch.
- `App.jsx`, `ProtectedRoute.jsx`: public `/`, shared `/login`, protected `/dashboard`; update sidebar, fallbacks, onboarding completion and login redirects. Preserve an allowlisted same-origin path plus query across authentication; reject external return URLs.
- Keep `/peak-projects` public and existing management feature paths protected. Add `/events/:slug` for public event detail and `/events/:slug/check-in` for assigned staff. Put specific public routes ahead of the protected catch-all. `/signup` may redirect to `/login?mode=signup` for compatibility.

Existing users do not re-register. Existing email collisions lead to sign-in/recovery. Club batch is not academic year, and signup cannot self-assign advanced batches.

## 5. RSVP, ticket and scanner implementation

### Data model

Extend `Event` with unique slug, venue, start/end, timezone, visibility, lifecycle status, RSVP/check-in windows, capacity, reservation count, assigned staff, audience years, and `allowWalkIns: false`. Preserve legacy `date` through a compatible migration.

Represent community-wide events using an explicit `scope: community | domain`; keep `domain` restricted to the four existing values and required only for domain-specific events. Do not invent an `All` domain or arbitrarily label this event Code Crafters.

Add `EventRegistration` with event/member references, `reserved | cancelled | checked_in` status, ticket nonce/version, reservation/cancellation/check-in times and `checkedInBy`. Create a unique compound index on `(eventId, memberId)` and roster indexes by event/status. Keep historical attendance separately identifiable from new reservations.

Add append-only attendance audit records for redemption/corrections. Record actor, event, registration, action, timestamp and request ID without recording raw QR credentials.

### Atomic behavior

- Reserve inside a MongoDB transaction: conditionally increment the event's reservation count only while registration is open and count is below 200, then create/reactivate the member's unique registration. Abort both changes on failure.
- Retry transient transaction conflicts safely. A repeated RSVP request returns the existing valid reservation; it never consumes a second seat. Duplicate key conflicts must roll back any counter increment.
- Cancellation changes only a reserved ticket, decrements count once and invalidates its nonce/version. Rebooking gets a new credential. Checked-in tickets cannot be cancelled by members.
- QR payload is a signed, event-bound ticket containing an opaque registration identifier, nonce/version and expiry. Use a dedicated signing secret, distinct from login JWTs; no email, name or authentication token in the QR.
- Scanner sends the ticket in the POST body over HTTPS. Backend verifies signature, selected event, ticket version, reservation status, staff assignment and server time. It conditionally changes `reserved` to `checked_in` and writes the audit entry in one transaction.
- Two simultaneous scans produce one admission and one explicit “already checked in” result with the original timestamp. Invalid, cancelled, expired, wrong-event and non-reserved tickets never admit anyone.
- The API never creates a reservation during scanning. No walk-in button, self-check-in endpoint, or capacity override may bypass these rules.

MongoDB supports multi-document transactions; use them deliberately for the reservation/counter invariant and verify the target Atlas deployment supports them. See [MongoDB transaction documentation](https://www.mongodb.com/docs/manual/core/transactions/).

### API contract

| Method/path under `/api` | Access | Purpose |
| --- | --- | --- |
| `POST /auth/signup` | Public, throttled | Create ordinary member and session |
| `GET /events/public/:slug` | Public | Published event details and availability summary only |
| `POST /events/:id/rsvp` | Eligible signed-in member | Reserve one seat idempotently |
| `DELETE /events/:id/rsvp` | Reservation owner | Cancel before cutoff |
| `GET /events/:id/my-ticket` | Reservation owner | Current registration and QR credential; no-store |
| `GET /events/:id/registrations` | Assigned staff/authorized manager | Paginated scoped roster and attendance counts |
| `POST /events/:id/check-ins` | Assigned staff | Redeem QR credential |
| `POST /events/:id/check-ins/:registrationId/corrections` | Authorized event manager | Audited correction with reason; never add unreserved attendees |

Retire or explicitly block legacy `POST /events/:id/checkin` for ticketed events. Adapt existing attendance reports and profile history so migrated records are not double-counted. Keep the human-reported attendance total clearly separate from verified QR check-ins.

### Frontend and event publication

- Add React Query hooks for public detail, personal reservation, cancellation, ticket retrieval, scanner and staff roster. Invalidate targeted queries and keep the open event detail synchronized after mutations.
- Event screens show “Reserve a seat”, “Your ticket”, “Sold out”, “Registration closed”, “Cancelled” and “Checked in” from server state. Availability shown before a click is advisory; the reservation transaction decides admission.
- Load the QR generator only on ticket screens and camera decoder only on staff screens. Show the attendee's name beside the QR for staff identity comparison. Permit saving a ticket for poor connectivity; a saved QR remains subject to online server validation.
- Staff scanner uses the rear camera, pauses after a decode, and displays a clear result before the next scan. Handle permission denial and network loss explicitly. Do not mark attendance locally or queue blind offline approvals. A staff-only QR-image decode fallback can redeem an existing ticket when the camera fails; it cannot create attendance without a reservation.
- Exclude credentials and scanner/ticket screens from PostHog capture/session replay and logging. Avoid QR tokens in URLs.
- Publish the event through an idempotent upsert script keyed by slug, with dry-run and explicit creator/staff IDs. Set capacity to 200 and no-walk-ins; show it on the homepage and member dashboard. Automatically change the CTA after closure/end rather than leaving “this Friday” visible indefinitely.

## 6. Public landing page and Peak visual direction

### Structure and copy sources

| Section | Content and evidence from the report |
| --- | --- |
| Hero | Peak Craft Informatics Community at Hawassa University; suggested headline “Build together. Reach new peaks.” Join CTA to `/login?mode=signup`; secondary link to public projects. |
| Featured event | Showcase announcement, date/time/venue, 200-seat RSVP and no-walk-in policy. This appears near the top until the event ends. |
| What members do | Project learning, mentoring, domain collaboration and community outreach. Semester One printed pp. 5/17; Semester Two printed pp. 9/12. |
| Four domains | Code Crafters, Turing Tribe, Cyber Crew, Pixel Peeps; short descriptions grounded in approved club materials. Semester Two printed p. 9 confirms the names. |
| Impact | 250+ new members in Semester One (p. 6); 6 completed cross-domain projects with 30+ participants in Semester Two (p. 12); 49 blood donors in Semester One (p. 15). Label all as report-period achievements. |
| Project highlights | Link to `/peak-projects`; use confirmed project records. Do not turn “9 upcoming projects” from Semester One into a completed-project claim. |
| Community gallery | Semester One showcase (p. 12); Semester Two kickoff (p. 4), women's day and school outreach (p. 6), model school outreach (p. 8). Use a curated selection of actual extracted photos. |
| Join/footer | Clear membership CTA, Telegram channel, annual report download, and only verified other social links. |

The PDF contains two separately paginated reports, dated February 12 and May 15, 2026. Store source references as semester + printed page + physical PDF page in a content manifest. The PDF has 35 physical pages; Semester Two begins at physical page 23. Verify every metric against its source before publishing. Do not present the repository's “800+” community context as a current, measured report statistic.

### Assets and styling

- Use the report's Peak logo, deep navy base, white typography and orange/cyan accents. Reinforce the peak motif with lightweight SVG ridgelines, angular section edges and restrained contour patterns. Build these in SVG/Tailwind; no heavy animation dependency is needed.
- Use original embedded photographs where extraction quality allows; avoid screenshots of report pages with tiny embedded captions. Keep a manifest of source page, crop, alt text, Cloudinary public ID, dimensions and attribution.
- Curate approximately 4–6 photos. Retain authentic campus/community imagery. Prefer a sharp existing logo asset over an enlarged bitmap extracted from the PDF.
- Use subtle hover/focus transitions and respect reduced motion. Keep text as HTML, maintain accessible contrast, responsive layouts and keyboard navigation. No autoplay video or gallery carousel dependency.
- Upload approved public assets to a dedicated Cloudinary folder, e.g. `pcic/public/landing/2026`; keep private uploads separate. Publish the report download only as a deliberate public artifact, not as part of initial page load.

### Loading budgets and delivery

- Pre-render the public homepage with React/Vite-compatible static generation so the first response includes meaningful content and metadata. Keep the existing stack; no framework migration is required.
- Use responsive Cloudinary variants with `f_auto,q_auto`, bounded widths, `srcset`/`sizes`, explicit dimensions and suitable cropping. Preload only the actual hero image; lazy-load below-fold photos. See [Cloudinary optimization documentation](https://cloudinary.com/documentation/image_optimization).
- Initial targets: mobile LCP ≤2.5 s, CLS ≤0.1, and field INP ≤200 ms when enough real traffic exists. Aim for ≤150 KB gzip initial public-route JavaScript and ≤600 KB initial transferred page resources, including a ≤180 KB hero. Treat these as budgets to measure, not promised results.
- Keep management charts, PDF export, QR scanner and authenticated data fetching out of the homepage's initial path. Defer optional analytics; use a system font or a small self-hosted subset.
- Give `/` static SEO metadata, canonical URL and social image. Pre-render the event page with its own metadata and accurate Event structured data. Provide sitemap and robots rules; mark login and private pages noindex. Search directives are not access controls.

## 7. Platform performance work

1. Establish baseline route bundle sizes, mobile Lighthouse results, API response sizes, Mongo query plans and warm/cold Vercel latency. The planning-time build failed with `vite: command not found`; restore dependencies from lockfiles before measuring. Do not claim a passing build or measured speedup.
2. Lazy-load route modules with React Suspense; dynamically import jsPDF/html2canvas and charts on the feature that uses them. Keep scanner dependencies scoped to staff check-in.
3. Paginate members/events/rosters with bounded page sizes, stable sorting, allowlisted filters and response projections. Use `.lean()` for read-only paths and avoid attendee population in list views.
4. Add indexes driven by real queries, including event slug/date, registration uniqueness/event-status, and member filters/search. Escape and bound regex input; prefer indexed prefix search or a measured search strategy. Inspect `explain()` before adding broad speculative indexes.
5. Keep public event details briefly cacheable; ticket, session, roster and personal responses use private/no-store rules. Refetch seat availability on focus and after RSVP; never authorize a reservation from a cached count.
6. Avoid duplicate dashboard aggregates and irrelevant role-forbidden requests. Reuse the Mongo connection promise in warm serverless instances and fail readiness cleanly on database loss.
7. Measure a staging burst of 250 concurrent RSVP attempts: exactly 200 distinct members can reserve. Target warm API p95 under 500 ms for ordinary reads and under 1 s for RSVP/check-in under a representative scanner load; record cold-start latency separately and revise targets from measured evidence.

## 8. GitHub Pages routing and deployment

This is a route reorganization on the existing domain; `/login` is the authentication entry point, not a directory to which the backend/database are moved. Vercel continues to serve `/api/*`; Cloudinary continues to serve media.

- Keep `client/public/CNAME` as `pcic.tech` and publish `client/dist` through the existing root deployment command.
- Emit actual static HTML entries for `/`, `/login/`, `/dashboard/`, other stable management routes, and the published event slug. GitHub Pages does not provide arbitrary SPA rewrites. Keep `404.html` as the fallback for unknown/dynamic routes; do not treat its response as an SEO-quality 200 page. GitHub documents [custom 404 handling](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).
- Keep Vite assets rooted at `/assets/` and test trailing-slash normalization, direct links and hard refreshes. Canonicalize public URLs consistently. The desired `/login` may normalize to `/login/` when served from a directory entry; verify exact behavior on preview/live hosting.
- Generate a real public homepage rather than a login redirect. Update all former dashboard links from `/` to `/dashboard`. Unknown URLs render a real not-found UI rather than silently opening the dashboard.
- Preserve existing API origins during launch. Update CORS only for actual preview/production origins; never use a wildcard for authenticated data. DNS changes are unnecessary for the homepage/dashboard split; the later API custom domain requires DNS verification.
- Review Pages' header limitations when designing frontend CSP. Apply API headers on Vercel and a compatible static CSP where possible; do not promise arbitrary response-header control on GitHub Pages.
- Deploy backwards-compatible backend additions first, apply dry-run-reviewed additive migrations, then publish the frontend and event data. Keep RSVP/check-in behind release flags until the full path passes staging.

## 9. Verification and acceptance gates

| Area | Required evidence |
| --- | --- |
| Signup | Any valid email accepted; immediate member session; concurrent duplicate emails create one account; role/batch/status injection rejected; existing accounts use recovery; wrong credentials do not cause redirect loops. |
| Authorization | Negative tests for each role, ownership, suspended/inactive status and incomplete onboarding; new members cannot read other members' strikes, private applications or rosters. |
| Reservations | 250 distinct simultaneous attempts yield exactly 200 reservations; duplicate/retried requests consume one seat; cancellation releases one seat; cancelled QR fails; rebooking rotates ticket; cutoff and eligibility enforced by server. |
| QR check-in | Two staff devices scanning the same ticket admit once; forged, expired, wrong-event and cancelled tickets fail; members cannot scan or call the staff endpoint; zero walk-ins/overrides. |
| Failure recovery | Database conflict/timeout does not leak capacity; network timeout followed by retry gives a consistent reservation/check-in result; camera denial has usable fallback; offline scanner does not claim success. |
| Reporting | Reservation count, checked-in count and historical reported totals remain distinct; profile history and dashboard do not double-count migrated records. |
| Sessions/uploads | Password reset invalidates sessions; logout revokes session; shared throttle works across instances; unauthorized upload rejected before storage; malformed/oversized files rejected; private document URLs are protected. |
| Routes | `/`, `/login`, `/dashboard`, `/peak-projects`, event detail and scanner survive direct load/refresh; return-to-event works after signup/onboarding; root is public even when signed in. |
| Landing | All facts trace to report pages; image crops inspected; mobile/keyboard/reduced-motion checks pass; no eager report download; performance budgets and accessibility measured. |
| Deployment | Build succeeds, required backend tests pass, new integration tests use an isolated test database, migrations are idempotent, and a staff rehearsal on real mobile browsers succeeds. |

Extend Node's existing test suite for auth and reservation logic; include meaningful browser tests for signup → RSVP → staff scan. Use a Mongo replica set test environment for transaction/concurrency tests. Check all existing test files, since the current `npm test` script enumerates only a subset. Never run destructive seeders/tests against the shared production database.

## 10. Delivery sequence and rollback

| Stage | Deliverable | Completion gate |
| --- | --- | --- |
| 1 | Reproducible baseline, dependency/secret review, access matrix and P0 fixes | No known member-data exposure through newly public signup; isolated tests ready |
| 2 | Signup, sessions, event schema, RSVP, QR and scoped scanner | Capacity/race/replay tests and end-to-end rehearsal pass |
| 3 | `/login` and `/dashboard` routing, homepage event promotion and seeded event | Direct-link checks and correct public event data |
| 4 | Full report-based landing page, Cloudinary assets and measured performance work | Source/crop review and mobile budgets |
| 5 | Remaining hardening, API custom-domain session improvement and operational monitoring | Session/security regressions closed and rollout checks complete |

Stages 1–3 are the Friday-critical path. Aim to finish staging and the staff rehearsal by Thursday, October 15, with time for fixes; this is a target, not a guarantee. Keep the richer gallery and optional visual refinements behind the working signup/RSVP/check-in release. Security, reservation integrity and staff authorization cannot be deferred to hit the event date.

Before launch: back up relevant collections; record frontend/API revisions; prepare migration dry-run counts; verify Vercel, Pages, Cloudinary and DNS access without collecting credentials in the plan. Select the event owner and staff IDs from existing authorized accounts.

Migrations must be additive, restartable and preserve legacy attendance. Do not reinterpret historical self-check-ins as new reservations. Preserve all decisions containing `[Academic Calendar]`; never run a general seed/wipe to publish this event.

Rollback: retain the last compatible frontend/API builds; disable new RSVP/scanner entry points if needed; preserve registrations and check-in audit data for repair. After ticketed registration begins, do not roll back to a backend that enables unrestricted legacy check-in. Use a known-compatible hardened build or disable ticketed writes while fixing. Restore data only with reconciliation so successful reservations are not lost.

Monitor signup failures, 401/403/429/5xx rates, reservation conflicts, remaining seats, scanner duplicates, DB latency and Cloudinary errors. Log request IDs and aggregates, not passwords or QR credentials. Verify the event CTA changes after October 16 and that existing member workflows still work.

## 11. Planning evidence and limits

- Read current auth, events, user models, middleware, upload configuration, routing, deployment files and selected authorization controllers. This is a targeted source review, not a claim that all vulnerabilities have been discovered.
- Read all extracted annual-report text and visually reviewed the cover and Semester Two events page at physical page 28. Full asset extraction/crop verification is an implementation task.
- Existing production infrastructure was confirmed by the user; provider settings, DNS access, production data, Cloudinary privacy and live performance remain to be verified during implementation.
- `npm run build` was attempted and failed because local Vite dependencies are absent. No dependency installation, backend integration test, production scan, event creation or deployment was performed for this plan.

Primary content source: `docs/PCIC Semester One & Two Digital Report.pdf`.
