import "dotenv/config";
import mongoose from "mongoose";
import Event from "./models/Event.js";
import User from "./models/User.js";

const slug = "project-showcase-semester-kickoff-2026";
const start = new Date("2026-10-16T10:30:00.000Z");
const end = new Date("2026-10-16T13:30:00.000Z");
const dryRun = !process.argv.includes("--apply");

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
await mongoose.connect(process.env.MONGODB_URI);
try {
  const president = await User.findOne({ role: "president", status: "active" }).select("_id");
  const organizers = await User.find({ role: "event_organizer", status: "active" }).select("_id");
  if (!president || organizers.length === 0) throw new Error("Active president and event organizer accounts are required");
  const existing = await Event.findOne({ slug });
  const changes = {
    slug, title: "PeakCraft Project Showcase & Semester Kick-Off",
    description: "🚨🔥 INFORMATICS STUDENTS, ARE YOU READY?! 🔥🚨\n\n💻🚀 PeakCraft Project Showcase & Semester Kick-Off is HERE!\n\n📢 Calling all 2nd & 3rd-year Informatics students! Come through for a session full of ideas, innovation, and fresh semester energy! 🤝💡\n\n📅 Date: Friday, 6/02/2019 E.C.\n⏰ Time: 7:30–10:30 LT\n📍 Venue: IoT Hall, 003\n\n🔥 Bring your curiosity. Bring your energy. Let’s kick off the semester STRONG! 🚀\n\n📲 Stay connected: @peakcraftcommunity\n\nSee you there, PeakCrafters! 🧡💙\n\n#PeakCraft #ProjectShowcase #SemesterKickOff",
    date: start, endAt: end, timeZone: "Africa/Addis_Ababa", venue: "IoT Hall, 003",
    scope: "community", domain: undefined, capacity: 200, audienceYears: [2, 3],
    isPublished: true, ticketed: true, allowWalkIns: false,
    assignedStaff: organizers.map((user) => user._id), createdBy: president._id,
  };
  if (existing && (existing.reservationCount > 0 || existing.attendees.length > 0)) {
    throw new Error("Existing event has attendance/reservations; review manually before updating");
  }
  if (dryRun) console.log(JSON.stringify({ dryRun: true, slug, existing: Boolean(existing), capacity: 200, assignedStaff: organizers.length }, null, 2));
  else {
    const result = await Event.findOneAndUpdate({ slug }, { $set: changes, $setOnInsert: { reservationCount: 0 } },
      { upsert: true, new: true, runValidators: true });
    console.log(JSON.stringify({ applied: true, id: String(result._id), slug }));
  }
} finally { await mongoose.disconnect(); }
