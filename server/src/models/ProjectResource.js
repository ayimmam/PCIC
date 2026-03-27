import mongoose from "mongoose";

const projectResourceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

projectResourceSchema.index({ project: 1 });

export default mongoose.model("ProjectResource", projectResourceSchema);
