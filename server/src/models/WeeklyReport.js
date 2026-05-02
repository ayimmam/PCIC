import mongoose from "mongoose";

const weeklyReportSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    weekNumber: { type: Number, required: true, min: 1 },
    summary: { type: String, required: true, trim: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    qualityScore: { type: Number, min: 1, max: 10, default: null },
    scoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

weeklyReportSchema.index({ project: 1, weekNumber: 1 });

export default mongoose.model("WeeklyReport", weeklyReportSchema);
