/**
 * Academic calendar seed — Hawassa University (actual dates).
 * Run once and keep; do not clear when removing dummy test data.
 * Usage: node src/seed-academic-calendar.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Decision from "./models/Decision.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";

const ACADEMIC_CALENDAR_MARKER = "[Academic Calendar]";

const entries = [
  { ethiopian: "መስከረም 05", start: "2025-09-15", end: "2025-09-15", title: "Staff on Duty" },
  { ethiopian: "መስከረም 07", start: "2025-09-17", end: "2025-09-17", title: "Staff General Assembly Day" },
  { ethiopian: "መስከረም 08–10", start: "2025-09-18", end: "2025-09-20", title: "Registration: All Regular, Graduate, Evening, and Weekend programs" },
  { ethiopian: "መስከረም 12", start: "2025-09-22", end: "2025-09-22", title: "Class begins: All Regular and Evening programs" },
  { ethiopian: "መስከረም 12–14", start: "2025-09-22", end: "2025-09-24", title: "Application for Remarking of Examination" },
  { ethiopian: "መስከረም 18", start: "2025-09-28", end: "2025-09-28", title: "Class begins: All Weekend programs" },
  { ethiopian: "መስከረም 21", start: "2025-10-01", end: "2025-10-01", title: "Last date to submit NG and Grade Change decisions (Previous Year)" },
  { ethiopian: "መስከረም 26–27", start: "2025-10-06", end: "2025-10-07", title: "Makeup/Supplementary Exam Period" },
  { ethiopian: "ጥቅምት 03–04", start: "2025-10-13", end: "2025-10-14", title: "Add & Drop courses" },
  { ethiopian: "ጥቅምት 24–28", start: "2025-11-03", end: "2025-11-07", title: "Thesis Defense" },
  { ethiopian: "ታህሳስ 13–19", start: "2025-12-22", end: "2025-12-28", title: "Instructor Evaluation Week (All programs)" },
  { ethiopian: "ታህሳስ 24", start: "2026-01-02", end: "2026-01-02", title: "Class End: Regular and Non-Graduating Evening programs" },
  { ethiopian: "ታህሳስ 27–ጥር 08", start: "2026-01-05", end: "2026-01-16", title: "First Semester Exam Period: Regular programs" },
  { ethiopian: "ጥር 12–21", start: "2026-01-20", end: "2026-01-28", title: "Semester Break for Regular Students" },
  { ethiopian: "ጥር 21–23", start: "2026-01-29", end: "2026-01-31", title: "Registration: All Regular, Weekend, and Evening programs" },
  { ethiopian: "ጥር 25", start: "2026-02-02", end: "2026-02-02", title: "Class begins: Regular and Evening programs" },
  { ethiopian: "ጥር 28–29", start: "2026-02-05", end: "2026-02-06", title: "Employability and job creation training for graduating class" },
  { ethiopian: "የካቲት 09–10", start: "2026-02-16", end: "2026-02-17", title: "Makeup/Supplementary Exam Period" },
  { ethiopian: "የካቲት 16–17", start: "2026-02-23", end: "2026-02-24", title: "Add & Drop courses" },
  { ethiopian: "መጋቢት 07–11", start: "2026-03-16", end: "2026-03-20", title: "Thesis Defense" },
  { ethiopian: "ግንቦት 03–09", start: "2026-05-11", end: "2026-05-17", title: "Instructor Evaluation Week" },
  { ethiopian: "ግንቦት 07", start: "2026-05-15", end: "2026-05-15", title: "Second Semester Class End: Regular and Evening programs" },
  { ethiopian: "ግንቦት 10–21", start: "2026-05-18", end: "2026-05-29", title: "Second Semester Exam Period: Regular programs" },
  { ethiopian: "ግንቦት 26", start: "2026-06-03", end: "2026-06-03", title: "Non-Graduating Classes Clear from Campus" },
  { ethiopian: "ሰኔ 13", start: "2026-06-20", end: "2026-06-20", title: "Graduation Ceremony at Main Campus" },
  { ethiopian: "ሰኔ 18–20", start: "2026-06-25", end: "2026-06-27", title: "Registration: All Weekend and Evening Programs" },
  { ethiopian: "ሐምሌ 06", start: "2026-07-13", end: "2026-07-13", title: "Summer Semester Class begin: Evening Programs" },
  { ethiopian: "ሐምሌ 06–07", start: "2026-07-13", end: "2026-07-14", title: "Registration: All Kiremit Programs" },
  { ethiopian: "ሐምሌ 08", start: "2026-07-15", end: "2026-07-15", title: "Kiremit Program Class Begin" },
  { ethiopian: "ሐምሌ 11", start: "2026-07-18", end: "2026-07-18", title: "Summer Semester Class begin: Weekend Programs" },
  { ethiopian: "ነሐሴ 22", start: "2026-08-28", end: "2026-08-28", title: "End of Classes: Kiremit and Evening Programs" },
  { ethiopian: "ነሐሴ 23–30", start: "2026-08-29", end: "2026-09-05", title: "Final Examination Period: Kiremit Students" },
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log("Connected to MongoDB");

    let author = await User.findOne().sort({ createdAt: 1 });
    if (!author) {
      const systemUser = await User.create({
        name: "System",
        email: "system@pcic.academic",
        password: "nologin",
        role: "member",
        batch: "batch_1",
        domain: "General",
      });
      author = systemUser;
      console.log("Created system user for academic calendar");
    }

    await Decision.deleteMany({ description: { $regex: ACADEMIC_CALENDAR_MARKER } });
    console.log("Cleared existing academic calendar entries");

    const docs = entries.map((e) => ({
      title: e.title,
      description: `${e.ethiopian} — ${ACADEMIC_CALENDAR_MARKER}`,
      category: "exam-schedule",
      status: "implemented",
      startDate: new Date(e.start),
      endDate: new Date(e.end),
      stakeholders: ["University"],
      author: author._id,
      timeline: [{ status: "implemented", changedBy: author._id, notes: "Academic calendar" }],
      actionItems: [],
    }));

    await Decision.insertMany(docs);
    console.log(`Inserted ${docs.length} academic calendar entries.`);

    await mongoose.disconnect();
    console.log("Done. Academic calendar seeded.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

run();
