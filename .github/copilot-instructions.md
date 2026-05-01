# GitHub Copilot Instructions — PCIC Management System

## Project Context

Internal management system for the Peak Craft Informatics Community (PCIC). Monorepo with `client/` (React + Vite) and `server/` (Node.js + Express + MongoDB).

## Hard Rules

- **JSX only** — no TypeScript, no .ts/.tsx files, no type annotations
- **ES modules** — `import`/`export` everywhere, never `require`
- **Tailwind CSS** — no other styling approaches
- Use `@/` path alias for all client-side imports (maps to `client/src/`)
- React Query for data fetching, react-hook-form + zod for forms
- Shadcn UI components from `@/components/ui/` — don't create new CSS
- Backend: routes -> controllers -> models pattern, all under `/api/`
- Auth: JWT tokens, `auth` middleware + `roleGuard(...)` for protected routes
- Roles: president, pm, mc, domain_leader, member

## Code Patterns

### Frontend Component

```jsx
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MyComponent() {
  // component logic
}
```

### Backend Route + Controller

```javascript
// routes/feature.js
import { Router } from "express";
import { getAll } from "../controllers/featureController.js";
import auth from "../middleware/auth.js";
const router = Router();
router.get("/", auth, getAll);
export default router;

// controllers/featureController.js
import Model from "../models/Model.js";
export const getAll = async (req, res) => {
  try {
    const items = await Model.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### React Query Hook

```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => { const { data } = await api.get("/items"); return data; },
  });
}
```

## Existing Modules

Events, Decisions, Strikes, Candidates, Members — each has model, controller, routes, hook, components, and page already built. Follow the same patterns when extending.
