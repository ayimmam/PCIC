/**
 * Integration tests for the /api/peak-projects endpoint.
 * Uses Node built-in test runner (node:test) — same pattern as existing tests.
 *
 * Requires:
 *   - MONGODB_URI env var (same DB as dev)
 *   - Server NOT already running on the test port (uses port 0 for a random free port)
 *
 * Run:  npm test  (from server/)
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import app from "../src/index.js";
import ProjectComment from "../src/models/ProjectComment.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const MONGODB_URI = process.env.MONGODB_URI;
const TEST_SLUG = "pcic-management-system";
const TEST_PREFIX = "__test__";

let baseUrl;
let server;

/**
 * Helper: sends a request to the test server.
 */
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${baseUrl}${path}`, opts);
}

describe("/api/peak-projects", () => {
  before(async () => {
    if (!MONGODB_URI) {
      console.warn("Skip: MONGODB_URI not set");
      return;
    }

    // Wait for the DB connection that index.js initiates
    await mongoose.connection.asPromise();

    // Start Express on a random port so we don't collide with a running dev server
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    // Clean up test comments
    if (mongoose.connection.readyState === 1) {
      await ProjectComment.deleteMany({
        authorName: { $regex: `^${TEST_PREFIX}` },
      });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Disconnect mongoose so the process can exit
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ──────────────────── POST tests ────────────────────

  it("POST /comments — creates a comment and returns 201", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("POST", "/api/peak-projects/comments", {
      projectSlug: TEST_SLUG,
      authorName: `${TEST_PREFIX}Alice`,
      body: "Great project!",
      type: "comment",
    });
    assert.equal(res.status, 201);

    const json = await res.json();
    assert.equal(json.projectSlug, TEST_SLUG);
    assert.equal(json.authorName, `${TEST_PREFIX}Alice`);
    assert.equal(json.body, "Great project!");
    assert.equal(json.type, "comment");
    assert.ok(json._id);
  });

  it("POST /comments — creates a bug report", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("POST", "/api/peak-projects/comments", {
      projectSlug: TEST_SLUG,
      authorName: `${TEST_PREFIX}Bob`,
      body: "Button doesn't work on mobile",
      type: "bug",
    });
    assert.equal(res.status, 201);

    const json = await res.json();
    assert.equal(json.type, "bug");
  });

  // ──────────────────── GET tests ────────────────────

  it("GET /comments/:slug — returns comments for a valid slug", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", `/api/peak-projects/comments/${TEST_SLUG}`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(Array.isArray(json));
    // We created at least 2 comments above
    const testComments = json.filter((c) =>
      c.authorName.startsWith(TEST_PREFIX)
    );
    assert.ok(testComments.length >= 2, `Expected >= 2 test comments, got ${testComments.length}`);
  });

  it("GET /comments/:slug — returns 400 for an invalid slug", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("GET", "/api/peak-projects/comments/non-existent-slug");
    assert.equal(res.status, 400);
  });

  // ──────────────────── Validation tests ────────────────────

  it("POST /comments — rejects missing body fields", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("POST", "/api/peak-projects/comments", {
      projectSlug: TEST_SLUG,
    });
    assert.equal(res.status, 400);
  });

  it("POST /comments — rejects invalid slug", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("POST", "/api/peak-projects/comments", {
      projectSlug: "totally-fake-slug",
      authorName: `${TEST_PREFIX}Eve`,
      body: "Test",
    });
    assert.equal(res.status, 400);
  });

  it("POST /comments — rejects invalid type", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    const res = await api("POST", "/api/peak-projects/comments", {
      projectSlug: TEST_SLUG,
      authorName: `${TEST_PREFIX}Frank`,
      body: "Test",
      type: "feature-request",
    });
    assert.equal(res.status, 400);
  });

  // ──────────────────── Rate-limit test ────────────────────

  it("POST /comments — rate-limits after 5 requests", async (t) => {
    if (!MONGODB_URI) { t.skip("MONGODB_URI not set"); return; }

    // The rate limiter is per-IP. Our previous tests already consumed
    // some of the 5-request budget, so we fire enough to exceed it.
    const results = [];
    for (let i = 0; i < 6; i++) {
      const res = await api("POST", "/api/peak-projects/comments", {
        projectSlug: TEST_SLUG,
        authorName: `${TEST_PREFIX}RateTest${i}`,
        body: `Rate limit test ${i}`,
      });
      results.push(res.status);
    }

    // At least one of the later requests should be 429
    assert.ok(
      results.includes(429),
      `Expected at least one 429 status, got: ${results.join(", ")}`
    );
  });
});
