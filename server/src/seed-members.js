/**
 * Member roster seeder.
 *
 * Creates member accounts from a fixed list of emails, all sharing one
 * temporary password. Every account is flagged `mustResetPassword`, so the
 * first time a member logs in they are locked to the onboarding screen and
 * must set their full name + a personal password before using the app.
 *
 * Credentials are distributed manually (e.g. over Telegram) — no email is sent.
 *
 * Usage:
 *   1. Edit TEMP_PASSWORD and MEMBER_EMAILS below (or paste from the roster sheet).
 *   2. Run: npm run seed:members
 *
 * Re-running is safe: existing emails are skipped, not overwritten.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";

/* ── EDIT THESE ──────────────────────────────────────────────────────────── */

/** Single temporary password shared by every member in this batch. */
const TEMP_PASSWORD = "PcicWelcome2026";

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

  for (const raw of MEMBER_EMAILS) {
    const email = String(raw).trim().toLowerCase();
    if (!email) continue;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`  skip  ${email} (already exists)`);
      skipped += 1;
      continue;
    }

    // Use the model (not insertMany) so the pre-save hook hashes the password.
    await User.create({
      name: placeholderName(email),
      email,
      password: TEMP_PASSWORD,
      mustResetPassword: true,
      ...DEFAULTS,
    });
    console.log(`  add   ${email}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  console.log(`Temporary password for all new accounts: ${TEMP_PASSWORD}`);

  await mongoose.disconnect();
}

seedMembers().catch((err) => {
  console.error("Member seeding failed:", err);
  process.exit(1);
});
