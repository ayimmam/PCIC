import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDomainStudentUsers,
  STUDENT_DOMAINS,
  DOMAIN_EMAIL_SLUG,
} from "../src/seed/domainStudents.js";

describe("buildDomainStudentUsers (no database)", () => {
  it("emits three students per domain with unique emails", () => {
    const rows = buildDomainStudentUsers();
    assert.equal(rows.length, STUDENT_DOMAINS.length * 3);
    assert.equal(STUDENT_DOMAINS.length, 4);
    const emails = new Set(rows.map((r) => r.email));
    assert.equal(emails.size, rows.length, "emails must be unique");
  });

  it("covers every domain slug once per index", () => {
    for (const domain of STUDENT_DOMAINS) {
      assert.ok(DOMAIN_EMAIL_SLUG[domain], `missing slug for ${domain}`);
    }
  });

  it("varies batch and status across the three roster slots", () => {
    const rows = buildDomainStudentUsers();
    const byDomain = {};
    for (const r of rows) {
      if (!byDomain[r.domain]) byDomain[r.domain] = [];
      byDomain[r.domain].push(r);
    }
    for (const domain of STUDENT_DOMAINS) {
      const group = byDomain[domain];
      assert.equal(group.length, 3);
      const batches = new Set(group.map((g) => g.batch));
      const statuses = new Set(group.map((g) => g.status));
      assert.ok(batches.size >= 2, `${domain}: expected mixed batches`);
      assert.ok(statuses.size >= 2, `${domain}: expected mixed statuses`);
    }
  });
});
