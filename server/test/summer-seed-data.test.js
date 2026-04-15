/**
 * Smoke test: after `npm run seed`, domain roster members exist with expected variety.
 * Run from server/: `npm test` (requires MONGODB_URI, same DB as seed).
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { STUDENT_DOMAINS, buildDomainStudentUsers } from "../src/seed/domainStudents.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const MONGODB_URI = process.env.MONGODB_URI;

describe("seeded domain students", () => {
  before(async () => {
    if (!MONGODB_URI) {
      console.warn("Skip: MONGODB_URI not set");
      return;
    }
    const isLocal =
      MONGODB_URI.includes("127.0.0.1") || MONGODB_URI.includes("localhost");
    await mongoose.connect(
      MONGODB_URI,
      isLocal ? {} : { tls: true, tlsAllowInvalidCertificates: false }
    );
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  it("has at least three members per PCIC domain (roster + legacy)", async (t) => {
    if (!MONGODB_URI) {
      t.skip("MONGODB_URI not set");
      return;
    }
    const rosterPresent = await User.exists({ email: "student.code-crafters.1@pcic.com" });
    if (!rosterPresent) {
      t.skip("Roster not in DB — run `cd server && npm run seed` first");
      return;
    }

    for (const domain of STUDENT_DOMAINS) {
      const n = await User.countDocuments({ role: "member", domain });
      assert.ok(
        n >= 3,
        `Expected at least 3 members in domain "${domain}", found ${n} (run npm run seed first)`
      );
    }
  });

  it("roster emails exist with mixed batch and status", async (t) => {
    if (!MONGODB_URI) {
      t.skip("MONGODB_URI not set");
      return;
    }
    const rosterPresent = await User.exists({ email: "student.code-crafters.1@pcic.com" });
    if (!rosterPresent) {
      t.skip("Roster not in DB — run `cd server && npm run seed` first");
      return;
    }

    const seeds = buildDomainStudentUsers();
    assert.equal(seeds.length, STUDENT_DOMAINS.length * 3);

    const first = seeds[0];
    const doc = await User.findOne({ email: first.email }).lean();
    assert.ok(doc, `Missing seeded user ${first.email}`);
    assert.equal(doc.role, "member");
    assert.ok(["batch_1", "batch_2", "batch_3"].includes(doc.batch));
    assert.ok(["active", "warning", "inactive"].includes(doc.status));
  });
});
