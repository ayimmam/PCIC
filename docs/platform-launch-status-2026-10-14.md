# PCIC launch implementation status — October 14, 2026

The implementation follows [the launch plan](platform-launch-implementation-plan-2026-10.md). The API is hosted on Vercel, the frontend on GitHub Pages at `pcic.tech`, and five public report photographs on Cloudinary.

## Live routes and event

- `/`: public Peak Craft homepage with report-based copy, four domains, impact figures and optimized Cloudinary imagery.
- `/login`: sign-in, immediate student signup and account recovery. GitHub Pages normalizes direct requests to `/login/`.
- `/dashboard`: protected management system. Direct requests normalize to `/dashboard/`.
- `/events/project-showcase-semester-kickoff-2026`: public event detail and signed-in RSVP. Assigned event organizers and the president can use its `/check-in` route.
- API showcase record: Friday, October 16, 2026, 1:30–4:30 PM East Africa Time, IoT Hall 003, 200 seats, no walk-ins. The production event was created idempotently and returned 200 open seats at publication.

## Verified

- Isolated MongoDB replica set integration tests: immediate member signup without privilege injection; shared rate limiting; idempotent showcase publication; private decision scoping; 200 of 250 parallel reservations; cancellation and rebooking; forged/cancelled/duplicate QR rejection; one admission across parallel scans.
- Frontend production build passed. GitHub Pages returned HTTP 200 for `/`, `/login/`, `/dashboard/`, the event route and the extracted image assets. The extensionless paths redirect to the matching trailing-slash directory pages.
- Vercel preview API connected to MongoDB and rejected invalid credentials. Production API returned the published event with the correct timestamp and capacity. Five Cloudinary uploads returned their expected image dimensions and optimized delivery URLs returned HTTP 200.
- Server production dependency audit returned zero advisories. The public homepage entry loads about 47 KB gzip JavaScript, about 10 KB gzip CSS, and a roughly 60 KB hero image. This is a transfer-size check, not a Lighthouse field measurement.

## Required operational follow-up

1. **Rotate the Cloudinary API credential** in Cloudinary and update the Vercel environment variables. During the first upload attempt, the provider's error message included credential material in a Vercel function log. The application now parses the existing Cloudinary URL format and logs only a generic upload error. Treat the logged credential as exposed; do not paste it into issues or chat.
2. Have an assigned Peak event organizer sign in on a real phone and rehearse camera permission, scanning, duplicate rejection and the image fallback with a controlled RSVP. The isolated transaction tests pass, but a real staff-device rehearsal has not been performed.
3. Confirm SMTP delivery for password recovery and monitor signup, RSVP, remaining seats, scanner failures and API 5xx rates before Friday. Production account creation and staff sign-in were not exercised with real credentials during this implementation.
4. A later hardening release should move sessions to rotating HttpOnly refresh cookies on an API custom domain. The current frontend migrates legacy tokens from localStorage to tab-scoped sessionStorage; tokens remain readable to JavaScript in that tab. Private uploaded documents still need an authenticated delivery migration. Build-tool advisories in Tailwind 3 and React Router 6 advisories remain constrained by the current stack and need separate remediation/reachability review.

The temporary Cloudinary synchronization endpoint and its production environment token were removed after the upload. The bootstrap flag used to publish the event is no longer present on the active API deployment; the event persists in MongoDB. Do not use broad seed or cleanup scripts for launch operations, and preserve `[Academic Calendar]` decisions.
