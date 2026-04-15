/**
 * Extra roster members for dev/demo: three per PCIC domain with mixed batch and status.
 * See server/src/constants/pcicDomains.js
 */
import { PCIC_DOMAINS } from "../constants/pcicDomains.js";

export const STUDENT_DOMAINS = [...PCIC_DOMAINS];

/** URL-safe slug → used in email local-part */
export const DOMAIN_EMAIL_SLUG = {
  "Code Crafters": "code-crafters",
  "Turing Tribe": "turing-tribe",
  "Cyber Crew": "cyber-crew",
  "Pixel Peeps": "pixel-peeps",
};

/** Three students per domain: different batch / status mixes */
const VARIANTS = [
  { batch: "batch_1", status: "active" },
  { batch: "batch_1", status: "warning" },
  { batch: "batch_2", status: "active" },
];

export function buildDomainStudentUsers() {
  const rows = [];
  for (const domain of STUDENT_DOMAINS) {
    const slug = DOMAIN_EMAIL_SLUG[domain];
    VARIANTS.forEach((v, i) => {
      rows.push({
        name: `${domain} roster ${i + 1}`,
        email: `student.${slug}.${i + 1}@pcic.com`,
        password: "password123",
        role: "member",
        batch: v.batch,
        domain,
        status: v.status,
      });
    });
  }
  return rows;
}
