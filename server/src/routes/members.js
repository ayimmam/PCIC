import { Router } from "express";
import {
	getMembers,
	getMemberCount,
	updateMemberStatus,
	updateMemberBatch,
	updateMemberProfile,
	getMyProfile,
	getMyStrikes,
	getMyAttendance,
	updateMyName,
	changeMyPassword,
} from "../controllers/memberController.js";
import { requestDismissFlag, approveDismissFlag } from "../controllers/strikeController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

/* ── Member self-service (must be before /:id routes) ──── */
router.get("/me", auth, getMyProfile);
router.get("/me/strikes", auth, getMyStrikes);
router.get("/me/attendance", auth, getMyAttendance);
router.put("/me/name", auth, updateMyName);
router.put("/me/password", auth, changeMyPassword);

/* ── Existing admin/leadership routes ──────────────────── */
router.get("/", auth, roleGuard("president", "vice_president", "pm", "mc", "domain_leader"), getMembers);
router.get("/count", auth, roleGuard("president", "vice_president", "pm", "mc", "domain_leader"), getMemberCount);
router.put("/:id", auth, roleGuard("president", "pm", "mc"), updateMemberProfile);
router.put("/:id/status", auth, roleGuard("president", "pm", "mc"), updateMemberStatus);
router.put("/:id/batch", auth, roleGuard("president"), updateMemberBatch);
router.put("/:id/request-dismiss-flag", auth, roleGuard("president", "pm", "mc"), requestDismissFlag);
router.put("/:id/approve-dismiss-flag", auth, roleGuard("president"), approveDismissFlag);

export default router;

