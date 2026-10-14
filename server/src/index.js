import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import bootstrapShowcase from "./bootstrapShowcase.js";
import bootstrapAdmin from "./bootstrapAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import memberRoutes from "./routes/members.js";
import decisionRoutes from "./routes/decisions.js";
import strikeRoutes from "./routes/strikes.js";
import candidateRoutes from "./routes/candidates.js";
import projectRoutes from "./routes/projects.js";
import leadershipComplianceRoutes from "./routes/leadership-compliance.js";
import summerProjectRoutes from "./routes/summer-projects.js";
import reportRoutes from "./routes/reports.js";
import peakProjectRoutes from "./routes/peak-projects.js";
import sanitize from "./middleware/sanitize.js";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Validation for critical environment variables in production/serverless
if (!process.env.MONGODB_URI) {
  console.error(
    "CRITICAL ERROR: MONGODB_URI is not defined. Please add it to your Vercel Environment Variables.",
  );
}
if (process.env.NODE_ENV === "production" && (!process.env.MONGODB_URI || !process.env.JWT_SECRET)) {
  throw new Error("Production database and JWT configuration are required");
}
if (!process.env.JWT_SECRET) {
  console.error(
    "CRITICAL ERROR: JWT_SECRET is not defined. Please add it to your Vercel Environment Variables.",
  );
}

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
let showcaseBootstrap;
let adminBootstrap;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      "http://localhost:5173",
      "https://pcic.tech",
    ],
    credentials: true,
  }),
);
// Legacy: keep permissive CORS as fallback comment
// app.use(cors()); // Use permissive CORS to resolve the preflight 404 issue
app.use(express.json({ limit: "256kb" }));
app.use(sanitize);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") return next();
  try {
    await connectDB();
    if (process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      adminBootstrap ||= bootstrapAdmin().catch((error) => { adminBootstrap = undefined; throw error; });
      await adminBootstrap;
    }
    if (process.env.SHOWCASE_BOOTSTRAP === "1") {
      showcaseBootstrap ||= bootstrapShowcase().catch((error) => {
        showcaseBootstrap = undefined;
        throw error;
      });
      await showcaseBootstrap;
    }
    next();
  }
  catch (error) {
    console.error("Database unavailable", error.message);
    res.status(503).json({ message: "Service temporarily unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/strikes", strikeRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leadership-compliance", leadershipComplianceRoutes);
app.use("/api/summer-projects", summerProjectRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/peak-projects", peakProjectRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ message: "Request too large" });
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ message: "Invalid JSON" });
  console.error("Unhandled API error", error);
  res.status(500).json({ message: "Internal server error" });
});

// For Vercel: Export the app as default
export default app;

// Establish DB connection
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  connectDB().then(() => app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`)))
    .catch((error) => console.error("MongoDB connection error:", error.message));
}
