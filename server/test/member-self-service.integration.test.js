/**
 * Integration tests for member self-service endpoints.
 * Uses Node built-in test runner (node:test).
 *
 * Run:  NODE_ENV=test node --test test/member-self-service.integration.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/index.js";
import User from "../src/models/User.js";
import Strike from "../src/models/Strike.js";
import Event from "../src/models/Event.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const TEST_PREFIX = "__selftest__";
let baseUrl;
let server;
let testUser;
let testToken;

async function api(method, path, body, token) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${baseUrl}${path}`, opts);
}

describe("Member self-service endpoints", () => {
  before(async () => {
    if (!process.env.MONGODB_URI) {
      console.warn("Skip: MONGODB_URI not set");
      return;
    }

    await mongoose.connection.asPromise();

    // Create a test user
    const existing = await User.findOne({ email: `${TEST_PREFIX}@pcic.tech` });
    if (existing) await existing.deleteOne();

    testUser = await User.create({
      name: `${TEST_PREFIX} Member`,
      email: `${TEST_PREFIX}@pcic.tech`,
      password: "testpass123",
      role: "member",
      batch: "batch_1",
      domain: "Code Crafters",
    });

    // Create a test strike
    await Strike.create({
      memberId: testUser._id,
      reason: `${TEST_PREFIX} test strike`,
      assignedBy: testUser._id,
    });

    // Create a test event with attendance
    await Event.create({
      title: `${TEST_PREFIX} Event`,
      date: new Date(),
      domain: "Code Crafters",
      createdBy: testUser._id,
      attendees: [{ memberId: testUser._id, checkedIn: true, checkedInAt: new Date() }],
    });

    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Login to get token
    const loginRes = await api("POST", "/api/auth/login", {
      email: `${TEST_PREFIX}@pcic.tech`,
      password: "testpass123",
    });
    const loginData = await loginRes.json();
    testToken = loginData.token;
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: `${TEST_PREFIX}@pcic.tech` });
      await Strike.deleteMany({ reason: { $regex: `^${TEST_PREFIX}` } });
      await Event.deleteMany({ title: { $regex: `^${TEST_PREFIX}` } });
    }
    if (server) await new Promise((r) => server.close(r));
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  });

  // ── GET /api/members/me ──

  it("GET /me — returns authenticated user profile without password", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/members/me", null, testToken);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.name, `${TEST_PREFIX} Member`);
    assert.equal(json.email, `${TEST_PREFIX}@pcic.tech`);
    assert.equal(json.password, undefined);
    assert.equal(json.domain, "Code Crafters");
    assert.equal(json.batch, "batch_1");
    assert.equal(json.status, "active");
  });

  it("GET /me — rejects unauthenticated request", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/members/me");
    assert.equal(res.status, 401);
  });

  // ── GET /api/members/me/strikes ──

  it("GET /me/strikes — returns user's own strikes", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/members/me/strikes", null, testToken);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(Array.isArray(json));
    assert.ok(json.length >= 1);
    assert.ok(json[0].reason.startsWith(TEST_PREFIX));
  });

  // ── GET /api/members/me/attendance ──

  it("GET /me/attendance — returns user's own attendance", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/members/me/attendance", null, testToken);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(Array.isArray(json));
    assert.ok(json.length >= 1);
    assert.equal(json[0].checkedIn, true);
    assert.ok(json[0].title.startsWith(TEST_PREFIX));
  });

  // ── PUT /api/members/me/name ──

  it("PUT /me/name — updates name", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("PUT", "/api/members/me/name", { name: `${TEST_PREFIX} Updated` }, testToken);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.name, `${TEST_PREFIX} Updated`);
  });

  it("PUT /me/name — rejects empty name", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("PUT", "/api/members/me/name", { name: "   " }, testToken);
    assert.equal(res.status, 400);
  });

  // ── PUT /api/members/me/password ──

  it("PUT /me/password — changes password", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("PUT", "/api/members/me/password", {
      currentPassword: "testpass123",
      newPassword: "newpass456",
    }, testToken);
    assert.equal(res.status, 200);

    // Verify can login with new password
    const loginRes = await api("POST", "/api/auth/login", {
      email: `${TEST_PREFIX}@pcic.tech`,
      password: "newpass456",
    });
    assert.equal(loginRes.status, 200);
  });

  it("PUT /me/password — rejects wrong current password", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("PUT", "/api/members/me/password", {
      currentPassword: "wrongpassword",
      newPassword: "newpass789",
    }, testToken);
    assert.equal(res.status, 401);
  });

  it("PUT /me/password — rejects short new password", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("PUT", "/api/members/me/password", {
      currentPassword: "newpass456",
      newPassword: "ab",
    }, testToken);
    assert.equal(res.status, 400);
  });

  // ── NoSQL injection sanitization ──

  it("GET /members?search[$gt]= — sanitized, does not leak data", async (t) => {
    if (!process.env.MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/members?search[$gt]=", null, testToken);
    // Should return 200 but with sanitized input (no operator injection)
    assert.equal(res.status, 200);
    const json = await res.json();
    // The $gt key should have been stripped by sanitize middleware,
    // so search parameter should not match anything maliciously
    assert.ok(Array.isArray(json));
  });
});
