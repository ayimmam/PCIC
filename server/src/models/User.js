import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["president", "pm", "mc", "domain_leader", "member"],
      default: "member",
    },
    batch: { type: String, enum: ["batch_1", "batch_2", "batch_3"], default: "batch_1" },
    domain: {
      type: String,
      enum: ["T&G", "Technical", "Events", "Marketing", "Finance", "General"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["active", "warning", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
