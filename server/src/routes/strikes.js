import { Router } from "express";
import { getStrikes, getMemberStrikes, getStrikeSummary, assignStrike } from "../controllers/strikeController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getStrikes);
router.get("/summary", auth, getStrikeSummary);
router.get("/member/:id", auth, getMemberStrikes);
router.post("/", auth, roleGuard("president", "pm", "mc"), assignStrike);

export default router;
