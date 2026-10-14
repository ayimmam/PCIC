import { Router } from "express";
import { login, register, signup, getMe, completeOnboarding, logout, requestPasswordReset, resetPassword } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import sharedRateLimit from "../middleware/sharedRateLimit.js";

const router = Router();

router.post("/login", sharedRateLimit("login"), login);
router.post("/signup", sharedRateLimit("signup", { ipLimit: 20, accountLimit: 5 }), signup);
router.post("/password-reset/request", sharedRateLimit("reset-request", { ipLimit: 20, accountLimit: 5 }), requestPasswordReset);
router.post("/password-reset/complete", sharedRateLimit("reset-complete", { ipLimit: 20 }), resetPassword);
router.post("/register", auth, roleGuard("president", "pm"), register);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.post("/complete-onboarding", auth, sharedRateLimit("onboarding", { ipLimit: 20 }), completeOnboarding);

export default router;
