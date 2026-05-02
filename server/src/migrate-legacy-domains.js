/**
 * One-shot migration: map legacy User.domain / Event.domain values to the four PCIC domains.
 * Safe to run multiple times (idempotent for already-migrated data).
 *
 * Usage: from server/ → `npm run migrate:domains`
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Event from "./models/Event.js";
import { PCIC_DOMAINS, LEGACY_DOMAIN_TO_PCIC_DOMAIN } from "./constants/pcicDomains.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pcic";

const isLocal = MONGODB_URI.includes("127.0.0.1") || MONGODB_URI.includes("localhost");

async function migrateUsers() {
  let total = 0;
  for (const [from, to] of Object.entries(LEGACY_DOMAIN_TO_PCIC_DOMAIN)) {
    const res = await User.updateMany({ domain: from }, { $set: { domain: to } });
    if (res.modifiedCount) {
      console.log(`  users: ${from} → ${to}: ${res.modifiedCount}`);
      total += res.modifiedCount;
    }
  }
  const fallback = await User.updateMany(
    { domain: { $nin: PCIC_DOMAINS } },
    { $set: { domain: "Code Crafters" } }
  );
  if (fallback.modifiedCount) {
    console.log(`  users: (unknown or null domain) → Code Crafters: ${fallback.modifiedCount}`);
    total += fallback.modifiedCount;
  }
  return total;
}

async function migrateEvents() {
  let total = 0;
  for (const [from, to] of Object.entries(LEGACY_DOMAIN_TO_PCIC_DOMAIN)) {
    const res = await Event.updateMany({ domain: from }, { $set: { domain: to } });
    if (res.modifiedCount) {
      console.log(`  events: ${from} → ${to}: ${res.modifiedCount}`);
      total += res.modifiedCount;
    }
  }
  const fallback = await Event.updateMany(
    { domain: { $nin: PCIC_DOMAINS } },
    { $set: { domain: "Code Crafters" } }
  );
  if (fallback.modifiedCount) {
    console.log(`  events: (unknown or null domain) → Code Crafters: ${fallback.modifiedCount}`);
    total += fallback.modifiedCount;
  }
  return total;
}

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(
    MONGODB_URI,
    isLocal ? {} : { tls: true, tlsAllowInvalidCertificates: false }
  );

  console.log("Migrating legacy domain labels → PCIC domains (Code Crafters, Turing Tribe, Cyber Crew, Pixel Peeps)…");
  const users = await migrateUsers();
  const events = await migrateEvents();

  console.log(`\nDone. Modified ${users} user document(s) and ${events} event document(s).`);
  console.log("You can run `npm run seed` on dev DBs if you prefer a full reset instead.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
