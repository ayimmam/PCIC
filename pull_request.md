## Summary

This PR resolves the 404 deployment issue on Vercel by implementing a root-level `vercel.json` for monorepo routing and improving backend environment stability.

## Changes

- [ ] Frontend changes
- [x] Backend changes: Exported `app` instance, fixed `.env` absolute path resolution, and added root `vercel.json`.
- [x] Infrastructure: Fixed missing `multer-storage-cloudinary` dependency in `package.json`.
- [ ] Database model changes

## Related Issue

Fixes Vercel 404 deployment errors.

## How to Test

1. **Local Backend Build**: Run `node server/src/index.js` from the project root. Verify it successfully connects to MongoDB (fixes the "uri must be a string" error).
2. **Frontend Build**: Run `npm run build` at the project root to verify the Vite production build.
3. **Deployment Ready**: Verify `vercel.json` exists at the root with correct rewrites for `/api/*`.

## Screenshots (if UI changes)

<!-- Paste screenshots here -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend and backend both work
- [x] No `console.log` left in production code (except server startup)
