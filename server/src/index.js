import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

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

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Validation for critical environment variables in production/serverless
if (!process.env.MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI is not defined. Please add it to your Vercel Environment Variables.");
}
if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined. Please add it to your Vercel Environment Variables.");
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Use permissive CORS to resolve the preflight 404 issue
app.use(express.json());

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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
});

// For Vercel: Export the app as default
export default app;

// Establish DB connection
connectDB().then(() => {
  // Only start listener if not in production/Vercel/test
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
    });
  }
});
