import mongoose from "mongoose";

const projectCommentSchema = new mongoose.Schema(
  {
    projectSlug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["comment", "bug"],
      default: "comment",
    },
  },
  { timestamps: true }
);

projectCommentSchema.index({ projectSlug: 1, createdAt: -1 });

export default mongoose.model("ProjectComment", projectCommentSchema);
