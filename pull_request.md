## Summary

This PR adds PostHog product analytics to the frontend. `posthog-js` is initialized on app load in both the root and `client/` React apps, gated behind an env var so it's a safe no-op if the key is ever unset.

## Changes

- [x] **PostHog Init**: Added `posthog.init(...)` in `src/main.jsx` and `client/src/main.jsx`, wrapped in `if (import.meta.env.VITE_POSTHOG_KEY)` so analytics are skipped gracefully when the key is missing.
- [x] **Dependency**: Added `posthog-js` to `package.json` and `client/package.json`.
- [x] **Env Config**: Added `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to `.env`, `.env.production`, `client/.env`, and the new `client/.env.production` (client previously had no production env file).

## Related Issue

N/A — analytics setup requested directly, no tracked issue.

## How to Test

1. **Local dev**: Run `npm run dev` (root) or `cd client && npm run dev`, open the app, and confirm a PostHog network request fires to `https://eu.i.posthog.com` (the project is EU-hosted).
2. **PostHog dashboard**: Check the PostHog project for the `phc_vvnu...` key and confirm pageview/session events are landing under "Live events."
3. **Build sanity**: Run `npm run build` in both root and `client/` and confirm they complete without errors (already verified).
4. **Disabled fallback**: Temporarily unset `VITE_POSTHOG_KEY` and confirm the app still loads normally with no PostHog calls.

## Screenshots (if UI changes)

<!-- No UI changes — analytics only -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend build succeeds in both root and `client/`
- [x] No `console.log` left in production code (except server startup)
