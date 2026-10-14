import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Event from "../src/models/Event.js";
import EventRegistration from "../src/models/EventRegistration.js";
import EventAttendanceAudit from "../src/models/EventAttendanceAudit.js";
import User from "../src/models/User.js";
import { rsvp, cancelRsvp, redeemCheckin } from "../src/controllers/eventRegistrationController.js";
import { signup, login } from "../src/controllers/authController.js";
import { updateMemberRole } from "../src/controllers/memberController.js";
import sharedRateLimit from "../src/middleware/sharedRateLimit.js";
import bootstrapShowcase from "../src/bootstrapShowcase.js";
import Decision from "../src/models/Decision.js";
import { getDecisions, getDecisionById, updateDecision } from "../src/controllers/decisionController.js";
import { updateEvent } from "../src/controllers/eventController.js";

let replica;
let event;
const staffId = new mongoose.Types.ObjectId();
process.env.JWT_SECRET = "isolated-test-secret-with-sufficient-length";

const response = () => ({
  code: 200, body: null,
  status(value) { this.code = value; return this; },
  set() { return this; },
  json(value) { this.body = value; return this; },
});
const call = async (handler, memberId, body = {}) => {
  const res = response();
  await handler({ params: { id: String(event._id) }, body,
    user: { _id: memberId, role: memberId.equals(staffId) ? "president" : "member", academicYear: 2 } }, res);
  return res;
};

describe("showcase reservation and QR check-in", () => {
  before(async () => {
    replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    await mongoose.connect(replica.getUri());
    await Promise.all([Event.init(), EventRegistration.init(), EventAttendanceAudit.init(), User.init(), Decision.init()]);
    event = await Event.create({
      title: "Test showcase", slug: "showcase-test", date: new Date(Date.now() + 10 * 60 * 1000),
      endAt: new Date(Date.now() + 3 * 60 * 60 * 1000), scope: "community",
      createdBy: staffId, assignedStaff: [staffId], ticketed: true, isPublished: true,
      allowWalkIns: false, capacity: 200, reservationCount: 0, audienceYears: [2, 3],
    });
  });
  after(async () => { await mongoose.disconnect(); await replica?.stop(); });

  it("creates an immediate member account without accepting submitted privileges", async () => {
    const res = response();
    await signup({ body: { name: "New Student", email: "NEW@example.test", password: "Strong9!xy",
      domain: "Cyber Crew", academicYear: 3, role: "president", batch: "batch_3", status: "warning" } }, res);
    assert.equal(res.code, 201);
    assert.equal(res.body.user.role, "member");
    assert.equal(res.body.user.batch, "batch_1");
    assert.equal(res.body.user.status, "active");
    assert.equal(res.body.user.email, "new@example.test");
    assert.equal(res.body.user.password, undefined);
    const signedIn = response();
    await login({ body: { email: "NEW@example.test", password: "Strong9!xy" } }, signedIn);
    assert.equal(signedIn.code, 200);
    assert.ok(signedIn.body.token);
  });

  it("rejects passwords outside 8–10 characters", async () => {
    for (const password of ["short7!", "morethan10!!"]) {
      const res = response();
      await signup({ body: { name: "New Student", email: "another@example.test", password,
        domain: "Cyber Crew", academicYear: 3 } }, res);
      assert.equal(res.code, 400);
    }
  });

  it("allows a president to assign a leadership role and invalidates sessions", async () => {
    const member = await User.findOne({ email: "new@example.test" });
    const res = response();
    await updateMemberRole({ params: { id: String(member._id) }, body: { role: "event_organizer" },
      user: { _id: staffId, role: "president" } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.role, "event_organizer");
    assert.equal(res.body.sessionVersion, 1);
    const self = response();
    await updateMemberRole({ params: { id: String(member._id) }, body: { role: "president" },
      user: { _id: member._id, role: "event_organizer" } }, self);
    assert.equal(self.code, 400);
  });

  it("shares signup attempt limits through MongoDB", async () => {
    const firstInstance = sharedRateLimit("signup-test", { ipLimit: 2, accountLimit: 2 });
    const secondInstance = sharedRateLimit("signup-test", { ipLimit: 2, accountLimit: 2 });
    const run = async (middleware) => {
      const res = response();
      let passed = false;
      await middleware({ ip: "203.0.113.12", body: { email: "student@example.test" } }, res, () => { passed = true; });
      return { code: res.code, passed };
    };
    assert.equal((await run(firstInstance)).passed, true);
    assert.equal((await run(secondInstance)).passed, true);
    assert.equal((await run(firstInstance)).code, 429);
  });

  it("publishes the exact event once with 200 seats and assigned staff", async () => {
    await User.create({ _id: staffId, name: "President", email: "president@example.test",
      password: "a-long-test-password", role: "president", domain: "Code Crafters" });
    const organizer = await User.create({ name: "Event Organizer", email: "organizer@example.test",
      password: "a-long-test-password", role: "event_organizer", domain: "Pixel Peeps" });
    const first = await bootstrapShowcase();
    const second = await bootstrapShowcase();
    assert.equal(String(first._id), String(second._id));
    assert.equal(first.capacity, 200);
    assert.equal(first.allowWalkIns, false);
    assert.equal(first.date.toISOString(), "2026-10-16T10:30:00.000Z");
    assert.ok(first.assignedStaff.some((id) => String(id) === String(organizer._id)));
    assert.equal(await Event.countDocuments({ slug: "project-showcase-semester-kickoff-2026" }), 1);
  });

  it("keeps private leadership decisions away from new members", async () => {
    const memberId = new mongoose.Types.ObjectId();
    const publicDecision = await Decision.create({ title: "Calendar", description: "[Academic Calendar] Term starts",
      category: "learning", author: staffId });
    const privateDecision = await Decision.create({ title: "Private", description: "Leadership only",
      category: "membership", author: staffId });
    const req = { user: { _id: memberId, role: "member" }, query: {}, params: {}, body: {} };
    const listing = response();
    await getDecisions(req, listing);
    assert.deepEqual(listing.body.map((row) => String(row._id)), [String(publicDecision._id)]);
    req.params.id = String(privateDecision._id);
    const detail = response();
    await getDecisionById(req, detail);
    assert.equal(detail.code, 404);
    const update = response();
    await updateDecision(req, update);
    assert.equal(update.code, 403);
    assert.equal(update.body.description, undefined);
  });

  it("does not let legacy event editing change ticketed capacity", async () => {
    const res = response();
    await updateEvent({ params: { id: String(event._id) }, body: { capacity: 300 } }, res);
    assert.equal(res.code, 409);
    assert.equal((await Event.findById(event._id)).capacity, 200);
  });

  it("admits exactly 200 out of 250 parallel requests", async () => {
    const members = Array.from({ length: 250 }, () => new mongoose.Types.ObjectId());
    const outcomes = await Promise.all(members.map((id) => call(rsvp, id, { academicYear: 2 })));
    const accepted = outcomes.filter((result) => result.code === 201);
    assert.equal(accepted.length, 200, JSON.stringify(outcomes.reduce((acc, row) => {
      acc[row.code] = (acc[row.code] || 0) + 1; return acc;
    }, {})));
    assert.equal(await EventRegistration.countDocuments({ eventId: event._id, status: "reserved" }), 200);
    assert.equal((await Event.findById(event._id)).reservationCount, 200);
    const repeated = await call(rsvp, members[0], { academicYear: 2 });
    assert.equal(repeated.code, 200);
    assert.equal((await Event.findById(event._id)).reservationCount, 200);
  });

  it("releases a seat once, rotates a rebooked ticket, and rejects a cancelled ticket", async () => {
    const member = (await EventRegistration.findOne({ eventId: event._id, status: "reserved" })).memberId;
    const old = await call(rsvp, member, { academicYear: 2 });
    assert.equal((await call(cancelRsvp, member)).code, 200);
    assert.equal((await call(cancelRsvp, member)).code, 200);
    assert.equal((await Event.findById(event._id)).reservationCount, 199);
    const rejected = await call(redeemCheckin, staffId, { ticket: old.body.ticket });
    assert.equal(rejected.code, 400);
    const rebook = await call(rsvp, member, { academicYear: 2 });
    assert.equal(rebook.code, 201);
    assert.notEqual(rebook.body.ticket, old.body.ticket);
    assert.equal((await Event.findById(event._id)).reservationCount, 200);
  });

  it("allows only one successful scan for a valid ticket", async () => {
    const member = (await EventRegistration.findOne({ eventId: event._id, status: "reserved" })).memberId;
    await User.create({ _id: member, name: "Test Attendee", email: "attendee@example.test",
      password: "a-long-test-password", domain: "Code Crafters", academicYear: 2 });
    const ticket = (await call(rsvp, member, { academicYear: 2 })).body.ticket;
    assert.equal((await call(redeemCheckin, member, { ticket })).code, 403);
    assert.equal((await call(redeemCheckin, staffId, { ticket: `${ticket}invalid` })).code, 400);
    const scans = await Promise.all([call(redeemCheckin, staffId, { ticket }), call(redeemCheckin, staffId, { ticket })]);
    assert.deepEqual(scans.map((row) => row.code).sort(), [200, 409]);
    assert.equal(scans.find((row) => row.code === 200).body.name, "Test Attendee");
    assert.equal(await EventAttendanceAudit.countDocuments({ eventId: event._id, action: "check_in" }), 1);
    assert.equal((await Event.findById(event._id)).reservationCount, 200);
  });
});
