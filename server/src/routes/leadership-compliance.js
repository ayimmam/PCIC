import { Router } from "express";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { uploadLeadershipReport } from "../utils/upload.js";
import {
  getDashboard,
  getSubmissionHistory,
  submitReport,
  addFeedback,
} from "../controllers/leadershipComplianceController.js";

const router = Router();

router.get("/dashboard", auth, roleGuard("president", "vice_president", "pm", "mc", "domain_leader"), getDashboard);
router.get(
  "/submissions/history",
  auth,
  roleGuard("president", "vice_president", "pm", "mc", "domain_leader"),
  getSubmissionHistory
);
router.post(
  "/submissions",
  auth,
  (req, res, next) => {
    uploadLeadershipReport.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  },
  submitReport
);
router.post("/submissions/:id/feedback", auth, roleGuard("president"), addFeedback);

export default router;