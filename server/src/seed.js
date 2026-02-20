import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Decision from "./models/Decision.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";

const seedUsers = [
  { name: "Admin President", email: "president@pcic.com", password: "password123", role: "president", batch: "batch_1", domain: "General" },
  { name: "Project Manager", email: "pm@pcic.com", password: "password123", role: "pm", batch: "batch_1", domain: "General" },
  { name: "Membership Coordinator", email: "mc@pcic.com", password: "password123", role: "mc", batch: "batch_1", domain: "General" },
  { name: "Tech Domain Leader", email: "tech.lead@pcic.com", password: "password123", role: "domain_leader", batch: "batch_2", domain: "Technical" },
  { name: "Public Relation", email: "pr@pcic.com", password: "password123", role: "pr", batch: "batch_1", domain: "Marketing" },
  { name: "Abebe Kebede", email: "abebe@pcic.com", password: "password123", role: "member", batch: "batch_2", domain: "Technical" },
  { name: "Sara Tadesse", email: "sara@pcic.com", password: "password123", role: "member", batch: "batch_1", domain: "Events" },
  { name: "Dawit Hailu", email: "dawit@pcic.com", password: "password123", role: "member", batch: "batch_3", domain: "T&G" },
];

const seedEvents = [
  { title: "Weekly Tech Session", description: "Hands-on coding workshop", date: new Date(Date.now() + 7 * 86400000), domain: "Technical", capacity: 50 },
  { title: "T&G Community Meeting", description: "Monthly community gathering", date: new Date(Date.now() + 14 * 86400000), domain: "T&G", capacity: 100 },
  { title: "Past Workshop: Git Basics", description: "Introduction to Git and GitHub", date: new Date(Date.now() - 7 * 86400000), domain: "Technical", capacity: 30 },
];

const seedDecisions = [
  { title: "Midterm Exam Schedule", description: "Approved exam dates for Spring 2026", category: "exam-schedule", status: "approved", stakeholders: ["President", "Faculty"] },
  { title: "Easter Holiday Break", description: "Holiday dates confirmed", category: "holiday", status: "implemented", stakeholders: ["President"] },
  { title: "Project Milestone Review", description: "Review of batch 2 project progress", category: "project-progress", status: "pending", stakeholders: ["PM", "Domain Leaders"] },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Decision.deleteMany({});
    console.log("Cleared existing data");

    // Seed users
    const users = await User.create(seedUsers);
    console.log(`Seeded ${users.length} users`);

    const president = users.find((u) => u.role === "president");

    // Seed events with createdBy
    const events = await Event.create(
      seedEvents.map((e) => ({ ...e, createdBy: president._id }))
    );
    console.log(`Seeded ${events.length} events`);

    // Seed decisions with author and timeline
    const decisions = await Decision.create(
      seedDecisions.map((d) => ({
        ...d,
        author: president._id,
        timeline: [{ status: d.status, changedBy: president._id, notes: "Seeded" }],
      }))
    );
    console.log(`Seeded ${decisions.length} decisions`);

    console.log("\n--- Test Accounts ---");
    console.log("President:  president@pcic.com  / password123");
    console.log("PM:         pm@pcic.com         / password123");
    console.log("MC:         mc@pcic.com         / password123");
    console.log("Leader:     tech.lead@pcic.com  / password123");
    console.log("Member:     abebe@pcic.com      / password123");

    await mongoose.disconnect();
    console.log("\nDone. Database seeded successfully.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
