import { Router } from "express";
import { login, register, getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.post("/login", login);
router.post("/register", auth, roleGuard("president", "pm"), register);
router.get("/me", auth, getMe);

export default router;
