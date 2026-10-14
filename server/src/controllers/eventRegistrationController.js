import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import EventAttendanceAudit from "../models/EventAttendanceAudit.js";
import User from "../models/User.js";

const signingKey = () => Buffer.from(crypto.hkdfSync("sha256", process.env.JWT_SECRET, "pcic-ticket", "event-qr-v1", 32));
const manageRoles = new Set(["president", "event_organizer"]);
const canScan = (event, user) => user.role === "president" ||
  (manageRoles.has(user.role) && event.assignedStaff.some((id) => id.toString() === user._id.toString()));

const publicEvent = (event) => ({
  _id: event._id, slug: event.slug, title: event.title, description: event.description,
  date: event.date, endAt: event.endAt, timeZone: event.timeZone, venue: event.venue,
  capacity: event.capacity, reservationCount: event.reservationCount,
  remaining: Math.max(0, event.capacity - event.reservationCount),
  audienceYears: event.audienceYears,
  registrationOpen: Boolean(event.ticketed && event.isPublished && new Date() < event.date && event.reservationCount < event.capacity),
});

const ticketResponse = (registration, event) => ({
  registration: {
    _id: registration._id, status: registration.status, academicYear: registration.academicYear,
    reservedAt: registration.reservedAt, checkedInAt: registration.checkedInAt,
  },
  ticket: registration.status === "reserved" || registration.status === "checked_in"
    ? jwt.sign({ registrationId: String(registration._id), eventId: String(event._id), nonce: registration.ticketNonce }, signingKey(), {
      algorithm: "HS256", issuer: "pcic-ticket", audience: "pcic-scanner",
      expiresIn: Math.max(1, Math.ceil((new Date(event.endAt || event.date).getTime() - Date.now()) / 1000)),
    }) : null,
});

const loadTicketed = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return Event.findOne({ _id: id, ticketed: true });
};

export const getPublicEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isPublished: true, ticketed: true }).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.set("Cache-Control", "public, max-age=15");
    res.json(publicEvent(event));
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load event" }); }
};

export const getMyTicket = async (req, res) => {
  try {
    const event = await loadTicketed(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const registration = await EventRegistration.findOne({ eventId: event._id, memberId: req.user._id });
    res.set("Cache-Control", "no-store");
    res.json(registration ? ticketResponse(registration, event) : { registration: null, ticket: null });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load ticket" }); }
};

export const rsvp = async (req, res) => {
  const academicYear = Number(req.body?.academicYear || req.user.academicYear);
  if (![2, 3].includes(academicYear)) return res.status(400).json({ message: "This event is for second- and third-year students" });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Event not found" });
  try {
    const event = await loadTicketed(req.params.id);
    if (!event || !event.isPublished) return res.status(404).json({ message: "Event not found" });
    const prior = await EventRegistration.findOne({ eventId: event._id, memberId: req.user._id });
    if (prior && prior.status !== "cancelled") return res.json(ticketResponse(prior, event));
    if (Date.now() >= event.date.getTime()) return res.status(409).json({ message: "Registration is closed" });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const claimed = await Event.findOneAndUpdate({ _id: event._id, ticketed: true, isPublished: true,
          date: { $gt: new Date() }, $expr: { $lt: ["$reservationCount", "$capacity"] } },
          { $inc: { reservationCount: 1 } }, { new: true, session });
        if (!claimed) throw Object.assign(new Error("No seats available"), { status: 409 });
        const now = new Date();
        const changed = await EventRegistration.findOneAndUpdate({ eventId: event._id, memberId: req.user._id,
          ...(prior ? { status: "cancelled" } : {}) },
          { $set: { status: "reserved", academicYear, ticketNonce: crypto.randomUUID(),
            reservedAt: now, cancelledAt: null, checkedInAt: null, checkedInBy: null } },
          { new: true, upsert: !prior, runValidators: true, session });
        if (!changed) throw Object.assign(new Error("Reservation changed"), { status: 409 });
      });
    } finally { await session.endSession(); }
    const [saved, updatedEvent] = await Promise.all([
      EventRegistration.findOne({ eventId: event._id, memberId: req.user._id }), loadTicketed(req.params.id),
    ]);
    res.set("Cache-Control", "no-store");
    res.status(201).json({ ...ticketResponse(saved, updatedEvent), event: publicEvent(updatedEvent) });
  } catch (error) {
    const current = await EventRegistration.findOne({ eventId: req.params.id, memberId: req.user._id }).catch(() => null);
    if (current && current.status !== "cancelled") {
      const event = await loadTicketed(req.params.id);
      return res.json(ticketResponse(current, event));
    }
    if (error.status === 409 || error.code === 11000) return res.status(409).json({ message: "No seats available or reservation changed; refresh and retry" });
    console.error("RSVP failed", error);
    res.status(500).json({ message: "Unable to reserve a seat" });
  }
};

export const cancelRsvp = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Event not found" });
  try {
    const event = await loadTicketed(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (Date.now() >= event.date.getTime()) return res.status(409).json({ message: "Cancellation is closed" });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const changed = await EventRegistration.findOneAndUpdate({ eventId: event._id,
          memberId: req.user._id, status: "reserved" },
          { $set: { status: "cancelled", cancelledAt: new Date(), ticketNonce: crypto.randomUUID() } }, { session });
        if (changed) {
          const result = await Event.updateOne({ _id: event._id, reservationCount: { $gt: 0 } },
            { $inc: { reservationCount: -1 } }, { session });
          if (result.modifiedCount !== 1) throw new Error("Reservation count is inconsistent");
        }
      });
    } finally { await session.endSession(); }
    res.json({ message: "Reservation cancelled" });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to cancel reservation" }); }
};

export const getRegistrations = async (req, res) => {
  try {
    const event = await loadTicketed(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!canScan(event, req.user)) return res.status(403).json({ message: "Not assigned to this event" });
    const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
    const [rows, total, checkedIn] = await Promise.all([
      EventRegistration.find({ eventId: event._id, status: { $ne: "cancelled" } })
        .populate("memberId", "name email").select("memberId status reservedAt checkedInAt academicYear")
        .sort({ reservedAt: 1, _id: 1 }).skip((page - 1) * 50).limit(50).lean(),
      EventRegistration.countDocuments({ eventId: event._id, status: { $ne: "cancelled" } }),
      EventRegistration.countDocuments({ eventId: event._id, status: "checked_in" }),
    ]);
    res.set("Cache-Control", "no-store");
    res.json({ rows, page, total, checkedIn });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load roster" }); }
};

export const redeemCheckin = async (req, res) => {
  try {
    const event = await loadTicketed(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!canScan(event, req.user)) return res.status(403).json({ message: "Not assigned to this event" });
    const now = Date.now();
    if (now < event.date.getTime() - 30 * 60 * 1000 || now > new Date(event.endAt).getTime()) {
      return res.status(409).json({ message: "Check-in is outside the event window" });
    }
    if (typeof req.body?.ticket !== "string" || req.body.ticket.length > 2000) return res.status(400).json({ message: "Invalid ticket" });
    let payload;
    try { payload = jwt.verify(req.body.ticket, signingKey(), { algorithms: ["HS256"], issuer: "pcic-ticket", audience: "pcic-scanner" }); }
    catch { return res.status(400).json({ message: "Invalid or expired ticket" }); }
    if (payload.eventId !== String(event._id) || !mongoose.isValidObjectId(payload.registrationId)) return res.status(400).json({ message: "Wrong event ticket" });
    const session = await mongoose.startSession();
    let updated;
    try {
      await session.withTransaction(async () => {
        updated = null;
        updated = await EventRegistration.findOneAndUpdate({ _id: payload.registrationId,
          eventId: event._id, ticketNonce: payload.nonce, status: "reserved" },
          { $set: { status: "checked_in", checkedInAt: new Date(), checkedInBy: req.user._id } },
          { new: true, session });
        if (!updated) return;
        await EventAttendanceAudit.create([{ eventId: event._id, registrationId: updated._id,
          actorId: req.user._id, action: "check_in" }], { session });
      });
    } finally { await session.endSession(); }
    if (!updated) {
      const previous = await EventRegistration.findOne({ _id: payload.registrationId,
        eventId: event._id, ticketNonce: payload.nonce });
      if (previous?.status === "checked_in") return res.status(409).json({ message: "Already checked in", checkedInAt: previous.checkedInAt });
      return res.status(400).json({ message: "Ticket is no longer valid" });
    }
    const member = await User.findById(updated.memberId).select("name").lean();
    res.set("Cache-Control", "no-store");
    res.json({ message: "Checked in", name: member?.name, checkedInAt: updated.checkedInAt });
  } catch (error) { console.error("Check-in failed", error); res.status(500).json({ message: "Unable to check in" }); }
};

export const correctCheckin = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.registrationId)) return res.status(404).json({ message: "Registration not found" });
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) return res.status(400).json({ message: "A correction reason is required" });
  try {
    const event = await loadTicketed(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!canScan(event, req.user)) return res.status(403).json({ message: "Not assigned to this event" });
    const session = await mongoose.startSession();
    let corrected;
    try {
      await session.withTransaction(async () => {
        corrected = await EventRegistration.findOneAndUpdate({ _id: req.params.registrationId,
          eventId: event._id, status: "checked_in" },
          { $set: { status: "reserved", checkedInAt: null, checkedInBy: null } }, { new: true, session });
        if (!corrected) return;
        await EventAttendanceAudit.create([{ eventId: event._id, registrationId: corrected._id,
          actorId: req.user._id, action: "undo_check_in", reason }], { session });
      });
    } finally { await session.endSession(); }
    if (!corrected) return res.status(409).json({ message: "No checked-in registration to correct" });
    res.json({ message: "Check-in corrected" });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to correct check-in" }); }
};
