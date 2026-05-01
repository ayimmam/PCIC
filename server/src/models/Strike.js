import mongoose from "mongoose";

const strikeSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deleteRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Strike", strikeSchema);
