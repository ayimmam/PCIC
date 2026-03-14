import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  changedAt: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

const actionItemSchema = new mongoose.Schema({
  task: { type: String, required: true, trim: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["pending", "done"], default: "pending" },
});

const decisionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "implemented"],
      default: "pending",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    stakeholders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timeline: [timelineEntrySchema],
    actionItems: [actionItemSchema],
  },
  { timestamps: true }
);

decisionSchema.pre("validate", function (next) {
  if (this.category === "exam-schedule" && (this.startDate == null || this.endDate == null)) {
    next(new Error("Exam schedule decisions require both startDate and endDate"));
  } else if (this.category === "holiday" && this.startDate == null) {
    next(new Error("Holiday decisions require at least startDate"));
  } else {
    next();
  }
});

export default mongoose.model("Decision", decisionSchema);
