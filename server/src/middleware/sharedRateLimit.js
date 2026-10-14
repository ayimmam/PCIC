import crypto from "node:crypto";
import RateLimitCounter from "../models/RateLimitCounter.js";

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Fixed windows use the window start in the key. TTL cleanup may lag, but
// expired counters cannot affect a later window.
export default function sharedRateLimit(action, { windowMs = 15 * 60 * 1000, ipLimit = 60, accountLimit = 10 } = {}) {
  return async (req, res, next) => {
    try {
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const expiresAt = new Date(windowStart + windowMs + 60_000);
      const ip = String(req.ip || "unknown");
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const scopes = [
        { value: `ip:${ip}`, limit: ipLimit },
        ...(email ? [
          { value: `pair:${ip}:${email}`, limit: accountLimit },
          { value: `account:${email}`, limit: Math.max(accountLimit * 3, 15) },
        ] : []),
      ];
      for (const scope of scopes) {
        const key = `${action}:${windowStart}:${digest(scope.value)}`;
        const result = await RateLimitCounter.findOneAndUpdate({ key },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
          { upsert: true, new: true, setDefaultsOnInsert: true });
        if (result.count > scope.limit) {
          res.set("Retry-After", String(Math.ceil((windowStart + windowMs - Date.now()) / 1000)));
          return res.status(429).json({ message: "Too many attempts. Please try again later." });
        }
      }
      next();
    } catch (error) {
      // Authentication and account creation should fail closed when the shared
      // abuse counter is unavailable.
      console.error("Shared rate limit unavailable", error);
      res.status(503).json({ message: "Account service temporarily unavailable" });
    }
  };
}
