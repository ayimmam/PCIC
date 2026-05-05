## Summary

This PR finalizes the project migration and split deployment (GitHub Pages + Vercel). It includes critical resilience fixes for Vercel serverless functions to prevent startup crashes and adds explicit environment variable validation for easier debugging.

## Changes

- [x] **Serverless Resilience**: Removed `process.exit(1)` from the database connection logic to prevent Vercel functions from crashing on startup.
- [x] **Environment Validation**: Added explicit logging for missing `MONGODB_URI` and `JWT_SECRET` variables to provide clear feedback in Vercel logs.
- [x] **Split Deployment**: Finalized the cross-domain configuration between GitHub Pages (`pcic.tech`) and the Vercel backend.

## Related Issue

Resolves Vercel `FUNCTION_INVOCATION_FAILED` errors and completes migration; Closes #final-migration-fix

## How to Test

1. **Frontend**: Verify that the live site on GitHub Pages continues to call the Vercel API.
2. **Backend**: Access `/api/health`. If variables are missing, the Vercel Logs will now accurately report the missing keys instead of showing a generic crash page.
3. **Vercel Settings**: Ensure **Root Directory** is set to `server` and all `.env` variables are added to the Vercel dashboard.

## Screenshots (if UI changes)

<!-- Paste screenshots here -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend and backend both work
- [x] No `console.log` left in production code (except server startup)
