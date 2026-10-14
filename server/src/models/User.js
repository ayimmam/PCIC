import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: [
        "president",
        "vice_president",
        "pm",
        "secretary",
        "domain_leader",
        "pr",
        "mc",
        "event_organizer",
        "member",
      ],
      default: "member",
    },
    batch: { type: String, enum: ["batch_1", "batch_2", "batch_3"], default: "batch_1" },
    domain: {
      type: String,
      enum: ["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"],
      default: "Code Crafters",
    },
    status: {
      type: String,
      enum: ["active", "warning", "inactive", "suspended"],
      default: "active",
    },
    mustResetPassword: { type: Boolean, default: false },
    academicYear: { type: Number, enum: [1, 2, 3, 4, 5], default: null },
    passwordChangedAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
    isFlagged: { type: Boolean, default: false },
    flagAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    dismissFlagRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
    this.sessionVersion = (this.sessionVersion || 0) + 1;
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
