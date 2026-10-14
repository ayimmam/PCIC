import Event from "./models/Event.js";
import User from "./models/User.js";

const slug = "project-showcase-semester-kickoff-2026";

// One-time, idempotent publication for environments whose sensitive database
// connection string cannot be exported for an external migration runner.
export default async function bootstrapShowcase() {
  const existing = await Event.findOne({ slug }).select("_id").lean();
  if (existing) return existing;
  const [president, organizers] = await Promise.all([
    User.findOne({ role: "president", status: "active" }).select("_id").lean(),
    User.find({ role: "event_organizer", status: "active" }).select("_id").lean(),
  ]);
  if (!president || organizers.length === 0) throw new Error("Active president and event organizer accounts are required to publish the showcase");
  return Event.findOneAndUpdate({ slug }, {
    $setOnInsert: {
      slug,
      title: "PeakCraft Project Showcase & Semester Kick-Off",
      description: "🚨🔥 INFORMATICS STUDENTS, ARE YOU READY?! 🔥🚨\n\n💻🚀 PeakCraft Project Showcase & Semester Kick-Off is HERE!\n\n📢 Calling all 2nd & 3rd-year Informatics students! Come through for a session full of ideas, innovation, and fresh semester energy! 🤝💡\n\n📅 Date: Friday, 6/02/2019 E.C.\n⏰ Time: 7:30–10:30 LT\n📍 Venue: IoT Hall, 003\n\n🔥 Bring your curiosity. Bring your energy. Let’s kick off the semester STRONG! 🚀\n\n📲 Stay connected: @peakcraftcommunity\n\nSee you there, PeakCrafters! 🧡💙\n\n#PeakCraft #ProjectShowcase #SemesterKickOff",
      date: new Date("2026-10-16T10:30:00.000Z"),
      endAt: new Date("2026-10-16T13:30:00.000Z"),
      timeZone: "Africa/Addis_Ababa", venue: "IoT Hall, 003",
      scope: "community", capacity: 200, reservationCount: 0,
      audienceYears: [2, 3], isPublished: true, ticketed: true, allowWalkIns: false,
      assignedStaff: organizers.map(({ _id }) => _id), createdBy: president._id,
    },
  }, { upsert: true, new: true, runValidators: true });
}
