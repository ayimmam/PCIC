import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    motivation: { type: String, default: "" },
    // Path to the uploaded promotion portfolio (PDF)
    portfolioUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    // Link candidate back to an existing member account
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedBatch: {
      type: String,
      enum: ["batch_1", "batch_2", "batch_3"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    // President's message (reason for approve/reject) — visible to applicant and MC
    reviewComment: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
