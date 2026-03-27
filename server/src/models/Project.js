import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    task: { type: String, required: true, trim: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "pending",
    },
    isWBS: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    deadline: { type: Date, required: true },
    projectLead: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "completed", "on_hold"],
      default: "active",
    },
    todos: [todoSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
