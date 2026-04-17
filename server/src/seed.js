import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Decision from "./models/Decision.js";
import Project from "./models/Project.js";
import WeeklyReport from "./models/WeeklyReport.js";
import ProjectResource from "./models/ProjectResource.js";
import ProjectIssue from "./models/ProjectIssue.js";
import SummerProjectSubmission from "./models/SummerProjectSubmission.js";
import LeadershipReport from "./models/LeadershipReport.js";
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
    await Project.deleteMany({});
    await WeeklyReport.deleteMany({});
    await ProjectResource.deleteMany({});
    await ProjectIssue.deleteMany({});
    await LeadershipReport.deleteMany({});
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

  // Seed projects
    const abebe = users.find((u) => u.email === "abebe@pcic.com");
    const dawit = users.find((u) => u.email === "dawit@pcic.com");
    const dlCode = users.find((u) => u.email === "leader.codecrafters@pcic.com");
    const dlTuring = users.find((u) => u.email === "leader.turingtribe@pcic.com");
    const dlCyber = users.find((u) => u.email === "leader.cybercrew@pcic.com");

    const projectMembers = [dlCode._id, dlTuring._id, abebe._id, dawit._id];

    const project1 = await Project.create({
      title: "PCIC Community Platform",
      description: "Build the internal web platform for PCIC member management, event tracking, and community engagement. The platform will serve 800+ members across IS, CS, and IT departments.",
      deadline: new Date(now + 75 * day),
      projectLead: dlCode._id,
      members: projectMembers,
      createdBy: pm._id,
      todos: [
        { task: "Setup project repository", assignee: dlCode._id, status: "done", isWBS: true, createdBy: pm._id, completedAt: new Date(now - 20 * day) },
        { task: "Design database schema", assignee: dlTuring._id, status: "done", isWBS: true, createdBy: pm._id, completedAt: new Date(now - 15 * day) },
        { task: "Implement authentication", assignee: abebe._id, status: "done", isWBS: true, createdBy: pm._id, completedAt: new Date(now - 10 * day) },
        { task: "Build member management UI", assignee: dlCode._id, status: "in_progress", isWBS: true, createdBy: pm._id },
        { task: "Create event module", assignee: dawit._id, status: "in_progress", isWBS: true, createdBy: pm._id },
        { task: "Implement reporting dashboard", assignee: dlTuring._id, status: "pending", isWBS: true, createdBy: pm._id },
        { task: "Add notification system", assignee: abebe._id, status: "pending", isWBS: true, createdBy: pm._id },
        { task: "Testing and QA", status: "pending", isWBS: true, createdBy: pm._id },
        { task: "Fix login page styling", assignee: dlCode._id, status: "pending", isWBS: false, createdBy: dlCode._id },
      ],
      repoUrl: "https://github.com/pcic/community-platform",
    });

    const project2 = await Project.create({
      title: "Student Portfolio Showcase",
      description: "A portfolio platform where PCIC members can showcase their projects, skills, and achievements to potential employers and the university community.",
      deadline: new Date(now + 60 * day),
      projectLead: dlTuring._id,
      members: [dlTuring._id, dawit._id, abebe._id],
      createdBy: pm._id,
      todos: [
        { task: "Wireframe design", assignee: dlTuring._id, status: "done", isWBS: true, createdBy: pm._id, completedAt: new Date(now - 12 * day) },
        { task: "Frontend scaffolding", assignee: dawit._id, status: "done", isWBS: true, createdBy: pm._id, completedAt: new Date(now - 8 * day) },
        { task: "Portfolio card component", assignee: abebe._id, status: "in_progress", isWBS: true, createdBy: pm._id },
        { task: "Search and filter", assignee: dlTuring._id, status: "pending", isWBS: true, createdBy: pm._id },
        { task: "Deploy to staging", status: "pending", isWBS: true, createdBy: pm._id },
      ],
    });

    // Seed weekly reports
    await WeeklyReport.create([
      { project: project1._id, weekNumber: 1, summary: "Set up the repository, configured CI/CD, and created initial project structure with Express and React.", submittedBy: dlCode._id, qualityScore: 8, scoredBy: pm._id },
      { project: project1._id, weekNumber: 2, summary: "Completed database schema design with all core models. Started authentication implementation.", submittedBy: dlCode._id, qualityScore: 7, scoredBy: pm._id },
      { project: project1._id, weekNumber: 3, summary: "Authentication fully working with JWT. Started member management CRUD operations.", submittedBy: dlCode._id },
      { project: project2._id, weekNumber: 1, summary: "Completed wireframes and got approval. Set up Vite + React scaffold.", submittedBy: dlTuring._id, qualityScore: 9, scoredBy: pm._id },
      { project: project2._id, weekNumber: 2, summary: "Built responsive layout and started portfolio card component.", submittedBy: dlTuring._id },
    ]);

    // Seed resources
    await ProjectResource.create([
      { project: project1._id, title: "React Best Practices Guide", url: "https://react.dev/learn", sharedBy: pm._id },
      { project: project1._id, title: "Express.js Documentation", url: "https://expressjs.com/en/guide/routing.html", sharedBy: pm._id },
      { project: project1._id, title: "Project Charter Template", url: "https://docs.google.com/templates/project-charter", sharedBy: pm._id },
      { project: project2._id, title: "Portfolio Design Inspiration", url: "https://dribbble.com/tags/portfolio", sharedBy: pm._id },
    ]);

    // Seed issues
    await ProjectIssue.create([
      {
        project: project1._id,
        subject: "API rate limiting needed",
        createdBy: dlCode._id,
        messages: [
          { sender: dlCode._id, content: "We need to add rate limiting to the API endpoints to prevent abuse. Currently there is no protection." },
          { sender: pm._id, content: "Good point. Use express-rate-limit package. Set 100 requests per 15 minutes per IP for now." },
          { sender: dlCode._id, content: "Will implement this in the next sprint. Thanks!" },
        ],
      },
      {
        project: project1._id,
        subject: "Database connection timeout in production",
        status: "resolved",
        createdBy: abebe._id,
        messages: [
          { sender: abebe._id, content: "Getting connection timeout errors when deploying to the staging server." },
          { sender: pm._id, content: "Check the MONGODB_URI env variable and make sure the IP whitelist includes the staging server." },
          { sender: abebe._id, content: "Fixed! The IP wasn't whitelisted. Working now." },
        ],
      },
    ]);

    const currentYear = new Date().getUTCFullYear();
    await LeadershipReport.create([
      {
        domainLeader: dlCode._id,
        domain: dlCode.domain,
        semester: `${currentYear}-S1`,
        reportTitle: "Code Crafters Semester Report",
        description: "Delivered weekly summaries, resolved event bottlenecks, and tracked active members.",
        fileUrl: "uploads/seed-leadership-code-crafters.pdf",
        notes: "All weekly reports submitted on time.",
        submittedAt: new Date(Date.UTC(currentYear, 2, 25)),
        version: 1,
        isLatest: true,
      },
      {
        domainLeader: dlTuring._id,
        domain: dlTuring.domain,
        semester: `${currentYear}-S1`,
        reportTitle: "Turing Tribe Semester Report",
        description: "Completed roadmap checkpoints and maintained documentation consistency.",
        fileUrl: "uploads/seed-leadership-turing-tribe.pdf",
        notes: "Submitted after deadline due to exam schedule overlap.",
        submittedAt: new Date(Date.UTC(currentYear, 4, 4)),
        version: 1,
        isLatest: true,
      },
      {
        domainLeader: dlCyber._id,
        domain: dlCyber.domain,
        semester: `${currentYear}-S1`,
        reportTitle: "Cyber Crew Semester Report",
        description: "Published technical updates and coordinated knowledge-sharing sessions.",
        fileUrl: "uploads/seed-leadership-cyber-crew.pdf",
        notes: "Initial version.",
        submittedAt: new Date(Date.UTC(currentYear, 1, 18)),
        version: 1,
        isLatest: true,
      },
    ]);

    console.log(`Seeded 2 projects with todos, reports, resources, issues, and leadership compliance samples`);

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
