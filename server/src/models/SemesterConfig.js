import mongoose from "mongoose";

const semesterConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["planned", "active", "closed"],
      default: "planned",
    },
    lockSubmissions: { type: Boolean, default: false },
    lockFeedback: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

semesterConfigSchema.index({ startDate: -1 });

export default mongoose.model("SemesterConfig", semesterConfigSchema);