import { Router } from "express";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { uploadLeadershipReport } from "../utils/upload.js";
import {
  COMPLIANCE_ROLES,
  getSemesters,
  createSemester,
  updateSemester,
  getDashboard,
  getSubmissionHistory,
  submitReport,
  addFeedback,
} from "../controllers/leadershipComplianceController.js";

const router = Router();

router.get("/semesters", auth, roleGuard(...COMPLIANCE_ROLES), getSemesters);
router.post("/semesters", auth, roleGuard("president"), createSemester);
router.patch("/semesters/:id", auth, roleGuard("president"), updateSemester);

router.get("/dashboard", auth, roleGuard(...COMPLIANCE_ROLES), getDashboard);
router.get(
  "/submissions/history",
  auth,
  roleGuard(...COMPLIANCE_ROLES),
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