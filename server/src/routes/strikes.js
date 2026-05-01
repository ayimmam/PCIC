import { Router } from "express";
import { getStrikes, getMemberStrikes, getStrikeSummary, assignStrike, requestDelete, approveDelete } from "../controllers/strikeController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getStrikes);
router.get("/summary", auth, getStrikeSummary);
router.get("/member/:id", auth, getMemberStrikes);
router.post("/", auth, roleGuard("president", "pm", "mc"), assignStrike);
router.put("/:id/request-delete", auth, roleGuard("president", "pm", "mc"), requestDelete);
router.delete("/:id", auth, roleGuard("president"), approveDelete);

export default router;
