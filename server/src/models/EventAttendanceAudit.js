import mongoose from "mongoose";

const eventAttendanceAuditSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRegistration", required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["check_in", "undo_check_in"], required: true },
  reason: { type: String, default: "" },
}, { timestamps: true });

eventAttendanceAuditSchema.index({ eventId: 1, createdAt: -1 });
export default mongoose.model("EventAttendanceAudit", eventAttendanceAuditSchema);
