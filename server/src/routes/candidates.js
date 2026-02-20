import { Router } from "express";
import { getCandidates, submitApplication, approveCandidate, rejectCandidate } from "../controllers/candidateController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import upload from "../utils/upload.js";

const router = Router();

router.get("/", auth, getCandidates);
router.post(
  "/",
  upload.fields([
    { name: "portfolio", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  submitApplication
);
router.put("/:id/approve", auth, roleGuard("president"), approveCandidate);
router.put("/:id/reject", auth, roleGuard("president"), rejectCandidate);

export default router;
