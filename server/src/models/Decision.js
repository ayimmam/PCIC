import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  changedAt: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

const decisionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["exam-schedule", "holiday", "stakeholder", "project-progress", "learning"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "implemented"],
      default: "pending",
    },
    stakeholders: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timeline: [timelineEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Decision", decisionSchema);
