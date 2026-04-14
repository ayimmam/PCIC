import mongoose from "mongoose";

const summerProjectSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    academicCycle: { type: String, required: true, trim: true, default: "summer-2026" },
    status: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
    gradeComment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

summerProjectSubmissionSchema.index({ student: 1, academicCycle: 1, status: 1 });

export default mongoose.model("SummerProjectSubmission", summerProjectSubmissionSchema);
