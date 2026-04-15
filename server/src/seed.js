import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Decision from "./models/Decision.js";
import SummerProjectSubmission from "./models/SummerProjectSubmission.js";
import { buildDomainStudentUsers } from "./seed/domainStudents.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";

const seedUsers = [
  { name: "Admin President", email: "president@pcic.com", password: "password123", role: "president", batch: "batch_1", domain: "Code Crafters" },
  { name: "Vice President", email: "vice.president@pcic.com", password: "password123", role: "vice_president", batch: "batch_1", domain: "Turing Tribe" },
  { name: "Project Manager", email: "pm@pcic.com", password: "password123", role: "pm", batch: "batch_1", domain: "Cyber Crew" },
  { name: "Secretary", email: "secretary@pcic.com", password: "password123", role: "secretary", batch: "batch_1", domain: "Pixel Peeps" },
  { name: "Public Relations", email: "pr@pcic.com", password: "password123", role: "pr", batch: "batch_1", domain: "Pixel Peeps" },
  { name: "Event Lead", email: "events.lead@pcic.com", password: "password123", role: "event_organizer", batch: "batch_1", domain: "Cyber Crew" },
  { name: "Membership Coordinator", email: "mc@pcic.com", password: "password123", role: "mc", batch: "batch_1", domain: "Code Crafters" },
  {
    name: "Domain Leader — Code Crafters",
    email: "leader.codecrafters@pcic.com",
    password: "password123",
    role: "domain_leader",
    batch: "batch_2",
    domain: "Code Crafters",
  },
  {
    name: "Domain Leader — Turing Tribe",
    email: "leader.turingtribe@pcic.com",
    password: "password123",
    role: "domain_leader",
    batch: "batch_2",
    domain: "Turing Tribe",
  },
  {
    name: "Domain Leader — Cyber Crew",
    email: "leader.cybercrew@pcic.com",
    password: "password123",
    role: "domain_leader",
    batch: "batch_2",
    domain: "Cyber Crew",
  },
  {
    name: "Domain Leader — Pixel Peeps",
    email: "leader.pixelpeeps@pcic.com",
    password: "password123",
    role: "domain_leader",
    batch: "batch_2",
    domain: "Pixel Peeps",
  },
  ...buildDomainStudentUsers(),
  { name: "Abebe Kebede", email: "abebe@pcic.com", password: "password123", role: "member", batch: "batch_2", domain: "Turing Tribe" },
  { name: "Sara Tadesse", email: "sara@pcic.com", password: "password123", role: "member", batch: "batch_1", domain: "Pixel Peeps" },
  {
    name: "Batch1 Summer Demo",
    email: "summer.batch1@pcic.com",
    password: "password123",
    role: "member",
    batch: "batch_1",
    domain: "Code Crafters",
  },
  { name: "Dawit Hailu", email: "dawit@pcic.com", password: "password123", role: "member", batch: "batch_3", domain: "Turing Tribe" },
];

const seedEvents = [
  { title: "Code Crafters build sprint", description: "Hands-on coding workshop", date: new Date(Date.now() + 7 * 86400000), domain: "Code Crafters", capacity: 50 },
  { title: "Turing Tribe community sync", description: "Monthly community gathering", date: new Date(Date.now() + 14 * 86400000), domain: "Turing Tribe", capacity: 100 },
  { title: "Past workshop: Git basics", description: "Introduction to Git and GitHub", date: new Date(Date.now() - 7 * 86400000), domain: "Cyber Crew", capacity: 30 },
];

const now = Date.now();
const day = 86400000;
const seedDecisions = [
  {
    title: "Midterm Exam Schedule",
    description: "Approved exam dates for Spring 2026",
    category: "exam-schedule",
    status: "approved",
    stakeholders: [],
    startDate: new Date(now + 60 * day),
    endDate: new Date(now + 65 * day),
  },
  {
    title: "Easter Holiday Break",
    description: "Holiday dates confirmed",
    category: "holiday",
    status: "implemented",
    stakeholders: [],
    startDate: new Date(now + 45 * day),
    endDate: new Date(now + 45 * day),
  },
  {
    title: "Project Milestone Review",
    description: "Review of batch 2 project progress",
    category: "project-progress",
    status: "pending",
    stakeholders: [],
    actionItems: [],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await SummerProjectSubmission.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Decision.deleteMany({});
    console.log("Cleared existing data");

    // Seed users
    const rosterCount = buildDomainStudentUsers().length;
    const users = await User.create(seedUsers);
    console.log(`Seeded ${users.length} users (includes ${rosterCount} domain roster students: student.<domain>.{1,2,3}@pcic.com)`);

    const president = users.find((u) => u.role === "president");
    const pm = users.find((u) => u.role === "pm");

    // Seed events with createdBy
    const events = await Event.create(
      seedEvents.map((e) => ({ ...e, createdBy: president._id }))
    );
    console.log(`Seeded ${events.length} events`);

    // Seed decisions with author, timeline, and optional action items
    const decisionsData = seedDecisions.map((d) => {
      const base = {
        ...d,
        author: president._id,
        timeline: [{ status: d.status, changedBy: president._id, notes: "Seeded" }],
      };
      if (d.title === "Project Milestone Review" && pm) {
        base.actionItems = [
          { task: "Send agenda to domain leaders", assignees: [pm._id], dueDate: new Date(now + 14 * day), status: "pending" },
          { task: "Collect progress reports", assignees: [president._id], dueDate: new Date(now + 21 * day), status: "pending" },
        ];
      }
      return base;
    });
    const decisions = await Decision.create(decisionsData);
    console.log(`Seeded ${decisions.length} decisions`);

    const summerDemo = users.find((u) => u.email === "summer.batch1@pcic.com");
    const summerCycle = process.env.SUMMER_PROJECT_CYCLE || "summer-2026";
    if (summerDemo) {
      await SummerProjectSubmission.create({
        student: summerDemo._id,
        fileUrl: "uploads/seed-summer-placeholder.pdf",
        title: "Demo summer project",
        notes: "Seeded pending submission — grade as Code Crafters Domain Leader",
        academicCycle: summerCycle,
        status: "pending",
      });
      console.log("Seeded 1 pending summer project (login leader.codecrafters@pcic.com to grade)");
    }

    console.log("\n--- Test Accounts ---");
    console.log("President:       president@pcic.com           / password123");
    console.log("Vice President:  vice.president@pcic.com      / password123");
    console.log("PM:              pm@pcic.com                  / password123");
    console.log("Secretary:       secretary@pcic.com         / password123");
    console.log("PR:              pr@pcic.com                  / password123");
    console.log("Event Lead:      events.lead@pcic.com       / password123");
    console.log("MC:              mc@pcic.com                  / password123");
    console.log("DL Code Crafters: leader.codecrafters@pcic.com / password123");
    console.log("DL Turing Tribe: leader.turingtribe@pcic.com  / password123");
    console.log("DL Cyber Crew:   leader.cybercrew@pcic.com    / password123");
    console.log("DL Pixel Peeps:  leader.pixelpeeps@pcic.com   / password123");
    console.log("Member:          abebe@pcic.com               / password123");
    console.log("Summer B1 demo:  summer.batch1@pcic.com       / password123  (pending summer project)");

    await mongoose.disconnect();
    console.log("\nDone. Database seeded successfully.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
