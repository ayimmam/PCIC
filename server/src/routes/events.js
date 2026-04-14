import { Router } from "express";
import { getEvents, getEventCount, createEvent, updateEvent, checkinEvent } from "../controllers/eventController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

router.get("/", auth, getEvents);
router.get("/count", auth, getEventCount);
router.post("/", auth, roleGuard("president", "pm", "mc", "domain_leader", "event_organizer"), createEvent);
router.put("/:id", auth, roleGuard("president", "pm", "mc", "domain_leader", "event_organizer"), updateEvent);
router.post("/:id/checkin", auth, checkinEvent);

export default router;
