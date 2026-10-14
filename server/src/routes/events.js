import { Router } from "express";
import { getEvents, getEventById, getEventCount, createEvent, updateEvent, checkinEvent } from "../controllers/eventController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { getPublicEvent, rsvp, cancelRsvp, getMyTicket, getRegistrations, redeemCheckin, correctCheckin } from "../controllers/eventRegistrationController.js";

const router = Router();

router.get("/public/:slug", getPublicEvent);
router.post("/:id/rsvp", auth, rsvp);
router.delete("/:id/rsvp", auth, cancelRsvp);
router.get("/:id/my-ticket", auth, getMyTicket);
router.get("/:id/registrations", auth, getRegistrations);
router.post("/:id/check-ins", auth, redeemCheckin);
router.post("/:id/check-ins/:registrationId/corrections", auth, correctCheckin);

router.get("/", auth, getEvents);
router.get("/count", auth, getEventCount);
router.get("/:id", auth, getEventById);
router.post("/", auth, roleGuard("president", "pm", "mc", "domain_leader", "event_organizer"), createEvent);
router.put("/:id", auth, roleGuard("president", "pm", "mc", "domain_leader", "event_organizer"), updateEvent);
router.post("/:id/checkin", auth, checkinEvent);

export default router;
