import mongoose from "mongoose";

const rateLimitCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

rateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RateLimitCounter", rateLimitCounterSchema);
