import express from "express";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { getReportData } from "../controllers/reportController.js";

const router = express.Router();

router.get("/aggregate", auth, roleGuard("president", "vice_president"), getReportData);

export default router;
