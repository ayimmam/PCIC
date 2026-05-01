---
name: add-feature
description: Scaffolds a new feature module across the full stack (Mongoose model, Express routes/controller, React Query hook, components, page). Use when adding a new feature, module, or CRUD resource to the PCIC system.
---

# Add a New Feature Module

## Checklist

Copy this and track progress:

```
Feature: [name]
- [ ] 1. Backend model
- [ ] 2. Backend controller
- [ ] 3. Backend routes
- [ ] 4. Mount routes in server/src/index.js
- [ ] 5. Frontend React Query hook
- [ ] 6. Frontend components
- [ ] 7. Frontend page
- [ ] 8. Add route in client/src/App.jsx
- [ ] 9. Add sidebar nav item in App.jsx (if top-level page)
```

## Step 1: Backend Model

Create `server/src/models/FeatureName.js`:

```javascript
import mongoose from "mongoose";

const featureSchema = new mongoose.Schema(
  {
    // fields here
  },
  { timestamps: true }
);

export default mongoose.model("FeatureName", featureSchema);
```

## Step 2: Backend Controller

Create `server/src/controllers/featureController.js` with named exports:

```javascript
import Feature from "../models/Feature.js";

export const getAll = async (req, res) => {
  try {
    const items = await Feature.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

## Step 3: Backend Routes

Create `server/src/routes/feature.js`:

```javascript
import { Router } from "express";
import { getAll, create } from "../controllers/featureController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();
router.get("/", auth, getAll);
router.post("/", auth, roleGuard("president", "pm"), create);
export default router;
```

## Step 4: Mount in server/src/index.js

```javascript
import featureRoutes from "./routes/feature.js";
app.use("/api/feature", featureRoutes);
```

## Step 5: Frontend Hook

Create `client/src/hooks/useFeature.js`:

```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useFeatures() {
  return useQuery({
    queryKey: ["features"],
    queryFn: async () => { const { data } = await api.get("/feature"); return data; },
  });
}

export function useCreateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => { const { data } = await api.post("/feature", payload); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["features"] }),
  });
}
```

## Step 6: Frontend Components

Create in `client/src/components/feature/`:
- List component (table or card grid)
- Detail component (Sheet for side panel)
- Create/edit form (Dialog)

Import UI from `@/components/ui/`, shared from `@/components/shared/`.

## Step 7: Frontend Page

Create `client/src/pages/Feature.jsx` composing the components above.

## Step 8-9: Routing

Add `<Route path="/feature" element={<Feature />} />` in App.jsx.
Add to `navItems` array if it should appear in sidebar.
