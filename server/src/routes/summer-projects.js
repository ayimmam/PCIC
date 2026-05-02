import { Router } from "express";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { uploadSummerProject } from "../utils/upload.js";
import {
  getMine,
  listPendingForGrader,
  submitSubmission,
  gradeSubmission,
} from "../controllers/summerProjectController.js";

const router = Router();

router.get("/mine", auth, getMine);
router.get("/pending", auth, roleGuard("domain_leader"), listPendingForGrader);
router.post(
  "/",
  auth,
  roleGuard("member"),
  (req, res, next) => {
    uploadSummerProject.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  },
  submitSubmission
);
router.put("/:id/grade", auth, roleGuard("domain_leader"), gradeSubmission);

export default router;
