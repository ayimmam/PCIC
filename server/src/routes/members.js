import { Router } from "express";
import {
	getMembers,
	getMemberCount,
	updateMemberStatus,
	updateMemberBatch,
	updateMemberProfile,
} from "../controllers/memberController.js";
import { requestDismissFlag, approveDismissFlag } from "../controllers/strikeController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getMembers);
router.get("/count", auth, getMemberCount);
router.put("/:id", auth, roleGuard("president", "pm", "mc"), updateMemberProfile);
router.put("/:id/status", auth, roleGuard("president", "pm", "mc"), updateMemberStatus);
router.put("/:id/batch", auth, roleGuard("president"), updateMemberBatch);
router.put("/:id/request-dismiss-flag", auth, roleGuard("president", "pm", "mc"), requestDismissFlag);
router.put("/:id/approve-dismiss-flag", auth, roleGuard("president"), approveDismissFlag);

export default router;
