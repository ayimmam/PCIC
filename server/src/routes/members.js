import { Router } from "express";
import { getMembers, getMemberCount, updateMemberStatus } from "../controllers/memberController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getMembers);
router.get("/count", auth, getMemberCount);
router.put("/:id/status", auth, roleGuard("president", "pm", "mc"), updateMemberStatus);

export default router;
