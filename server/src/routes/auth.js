import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { login, register, getMe, completeOnboarding } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

// Best-effort throttling: Vercel's serverless functions reset the default
// in-memory store per instance/cold start, so this slows brute-force sprays
// rather than hard-capping them. Acceptable for this threat model.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: { message: "Too many login attempts, please try again later" },
});

const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

router.post("/login", loginLimiter, login);
router.post("/register", auth, roleGuard("president", "pm"), register);
router.get("/me", auth, getMe);
router.post("/complete-onboarding", auth, onboardingLimiter, completeOnboarding);

export default router;
