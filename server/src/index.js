import { mkdirSync } from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { UPLOAD_DIR } from "./utils/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
void __dirname;
mkdirSync(UPLOAD_DIR, { recursive: true });
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
