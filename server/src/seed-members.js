/**
 * Member roster seeder.
 *
 * Creates member accounts from a fixed list of emails, each with its own
 * randomly generated temporary password. Every account is flagged
 * `mustResetPassword`, so the first time a member logs in they are locked
 * to the onboarding screen and must set their full name + a personal
 * password before using the app.
 *
 * Generated passwords are written to server/seed-output/ (gitignored, never
 * committed) as a CSV for the operator to distribute manually (e.g. over
 * Telegram) — no email is sent.
 *
 * Usage:
 *   1. Edit MEMBER_EMAILS below (or paste from the roster sheet).
 *   2. Run: npm run seed:members
 *   3. Distribute credentials from the printed CSV path, then delete the file.
 *
 * Re-running is safe: existing emails are skipped, not overwritten.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── EDIT THESE ──────────────────────────────────────────────────────────── */

/** Generates a random per-user temporary password. */
const generateTempPassword = () => crypto.randomBytes(9).toString("base64url");

/** Defaults applied to every seeded member (adjust per batch as needed). */
const DEFAULTS = {
  role: "member",
  batch: "batch_1",
  domain: "Code Crafters",
};

/**
 * Members to create. Format: name@pcic.tech (one per line).
 * The `name` field is a placeholder derived from the email; members set their
 * real first name during onboarding.
 */
const MEMBER_EMAILS = [
  // ── Test accounts (remove before the real roster import) ──
  "test.member@pcic.tech",
  "abebe.kebede@pcic.tech",
  "sara.tesfaye@pcic.tech",
  // ── Paste the real roster emails below ──
];

/* ────────────────────────────────────────────────────────────────────────── */

/** "abebe.kebede@pcic.tech" -> "Abebe Kebede" (placeholder until onboarding). */
const placeholderName = (email) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || email;

async function seedMembers() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let created = 0;
  let skipped = 0;
  const issued = [];

  for (const raw of MEMBER_EMAILS) {
    const email = String(raw).trim().toLowerCase();
    if (!email) continue;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`  skip  ${email} (already exists)`);
      skipped += 1;
      continue;
    }

    const tempPassword = generateTempPassword();

    // Use the model (not insertMany) so the pre-save hook hashes the password.
    await User.create({
      name: placeholderName(email),
      email,
      password: tempPassword,
      mustResetPassword: true,
      ...DEFAULTS,
    });
    console.log(`  add   ${email}`);
    created += 1;
    issued.push({ email, tempPassword });
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);

  if (issued.length > 0) {
    const outDir = path.join(__dirname, "..", "seed-output");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `member-credentials-${Date.now()}.csv`);
    const csv = ["email,temp_password", ...issued.map((r) => `${r.email},${r.tempPassword}`)].join("\n");
    fs.writeFileSync(outPath, csv, "utf8");
    console.log(`Temporary passwords written to: ${outPath}`);
    console.log("This file is gitignored — distribute the credentials, then delete it.");
  }

  await mongoose.disconnect();
}

seedMembers().catch((err) => {
  console.error("Member seeding failed:", err);
  process.exit(1);
});
