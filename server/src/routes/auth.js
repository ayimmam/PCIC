import { Router } from "express";
import { login, register, getMe, completeOnboarding } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.post("/login", login);
router.post("/register", auth, roleGuard("president", "pm"), register);
router.get("/me", auth, getMe);
router.post("/complete-onboarding", auth, completeOnboarding);

export default router;
