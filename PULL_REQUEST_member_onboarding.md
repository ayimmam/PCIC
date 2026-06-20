## Summary

This PR adds a **first-login onboarding flow** for invited members. Members are seeded with their `name@pcic.tech` email and a single shared temporary password. On their first login they are hard-gated to an onboarding screen where they set their full name and a personal password before they can access any part of the app. A welcome popup is shown once immediately after onboarding completes.

## Changes

- [x] **Temp-password flag**: Added `mustResetPassword` to the `User` model (defaults to `false`, so existing users are unaffected).
- [x] **Onboarding endpoint**: New `POST /api/auth/complete-onboarding` (auth-protected) that validates full name + new password (≥6 chars), stores the member's **first name**, hashes the new password, and clears `mustResetPassword`.
- [x] **Hard gate**: While `mustResetPassword` is true, `AppLayout` renders only the onboarding screen — no dashboard, routes, sidebar, or welcome popup. `ProtectedRoute`'s spinner prevents any pre-auth flash.
- [x] **Onboarding screen**: New `Onboarding.jsx` page (full name + new password + confirm) wired through `AuthContext.completeOnboarding`.
- [x] **Welcome popup for new members**: `WelcomeDialog` is force-shown once right after onboarding via a one-time `sessionStorage` signal, bypassing the saved "Don't show again" flag.
- [x] **Member seeder**: New `seed-members.js` + `npm run seed:members` to create accounts from an editable email list, all flagged for reset. Re-running skips existing emails. Credentials are distributed manually (Telegram); no email is sent.

## Related Issue

Implements member onboarding workflow (temporary password → forced reset on first login).

## How to Test

1. **Seed members**: From `server/`, edit `TEMP_PASSWORD` and `MEMBER_EMAILS` in `src/seed-members.js`, then run `npm run seed:members`.
2. **First login**: Sign in with a seeded member (e.g. `test.member@pcic.tech` / `PcicWelcome2026`). You should land on the **onboarding screen**, not the dashboard.
3. **Complete onboarding**: Enter a full name + new password. On success you land on the dashboard and the **"Welcome to PCIC" popup appears** (even if "Don't show again" was previously set in that browser).
4. **Re-login**: Log out and back in with the new password — you go straight to the dashboard, no gate, no forced popup.
5. **Existing users**: Confirm pre-existing accounts (admins/members) log in normally and are never gated.

> Note: local frontend must target the local backend. Set `VITE_API_BASE_URL=http://localhost:5000/api` in `client/.env` and restart Vite (the old `VITE_API_URL` key was unused, which silently pointed the app at the deployed backend).

## Screenshots (if UI changes)

<!-- Paste onboarding screen + welcome popup screenshots here -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend and backend both work
- [x] No `console.log` left in production code (except seeder/server startup output)
- [x] Backward compatible — `mustResetPassword` defaults to `false`; no migration required
