import { mkdirSync } from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

mkdirSync("uploads", { recursive: true });
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import memberRoutes from "./routes/members.js";
import decisionRoutes from "./routes/decisions.js";
import strikeRoutes from "./routes/strikes.js";
import candidateRoutes from "./routes/candidates.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/strikes", strikeRoutes);
app.use("/api/candidates", candidateRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
