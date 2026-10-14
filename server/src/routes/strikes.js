import { Router } from "express";
import { getStrikes, getMemberStrikes, getStrikeSummary, assignStrike, requestDelete, approveDelete } from "../controllers/strikeController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, roleGuard("president", "vice_president", "pm", "mc", "domain_leader"), getStrikes);
router.get("/summary", auth, roleGuard("president", "vice_president", "pm", "mc", "domain_leader"), getStrikeSummary);
router.get("/member/:id", auth, (req, res, next) => {
  if (req.params.id === req.user._id.toString() || ["president", "vice_president", "pm", "mc", "domain_leader"].includes(req.user.role)) return next();
  return res.status(403).json({ message: "Insufficient permissions" });
}, getMemberStrikes);
router.post("/", auth, roleGuard("president", "pm", "mc"), assignStrike);
router.put("/:id/request-delete", auth, roleGuard("president", "pm", "mc"), requestDelete);
router.delete("/:id", auth, roleGuard("president"), approveDelete);

export default router;
