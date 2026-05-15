import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getComments,
  postComment,
} from "../controllers/peakProjectController.js";

const router = Router();

const commentPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many comments from this IP, please try again later" },
});

router.get("/comments/:slug", getComments);
router.post("/comments", commentPostLimiter, postComment);

export default router;
