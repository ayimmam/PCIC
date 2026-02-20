import { Router } from "express";
import { getDecisions, createDecision, updateDecision } from "../controllers/decisionController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getDecisions);
router.post("/", auth, roleGuard("president", "pm"), createDecision);
router.put("/:id", auth, roleGuard("president", "pm"), updateDecision);

export default router;
