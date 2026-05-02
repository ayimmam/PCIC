import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const leadershipReportSchema = new mongoose.Schema(
  {
    domainLeader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: {
      type: String,
      enum: ["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"],
      required: true,
    },
    semester: { type: String, required: true, trim: true },
    reportTitle: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    fileUrl: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    evidenceUrl: { type: String, default: "", trim: true },
    submittedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1, min: 1 },
    isLatest: { type: Boolean, default: true },
    feedback: [feedbackSchema],
  },
  { timestamps: true }
);

leadershipReportSchema.index({ semester: 1, domain: 1 });
leadershipReportSchema.index({ domainLeader: 1, semester: 1, submittedAt: -1 });

export default mongoose.model("LeadershipReport", leadershipReportSchema);