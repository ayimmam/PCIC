## Summary

This PR finalizes the split deployment architecture for the PCIC Management System. It reconfigures the frontend (GitHub Pages) to communicate with the migrated backend on Vercel using a cross-domain API setup.

## Changes

- [x] Frontend changes: Updated `axios` base URLs in both root and client directories to point to the live Vercel backend.
- [x] Backend changes: Restored `server/vercel.json` for backend-only hosting and optimized environment variable pathing.
- [x] Infrastructure: Ensured all Vercel-specific dependencies (`multer-storage-cloudinary`, etc.) are correctly listed.

## Related Issue

Resolves 404 deployment errors and aligns cross-domain connectivity; Closes #split-deployment-setup

## How to Test

1. **Frontend**: Verify that API calls are directed to `https://pcic-hpw7.vercel.app/api` by checking the network tab on the live GitHub Pages site.
2. **Backend**: Confirm that the Vercel backend is accessible via `/api/health`.
3. **Vercel Settings**: Ensure the **Root Directory** in Vercel project settings is set to `server`.

## Screenshots (if UI changes)

<!-- Paste screenshots here -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend and backend both work
- [x] No `console.log` left in production code (except server startup)
