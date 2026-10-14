import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["reserved", "cancelled", "checked_in"], required: true },
  ticketNonce: { type: String, required: true },
  academicYear: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
  reservedAt: { type: Date },
  cancelledAt: { type: Date },
  checkedInAt: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

eventRegistrationSchema.index({ eventId: 1, memberId: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1, status: 1, reservedAt: 1 });

export default mongoose.model("EventRegistration", eventRegistrationSchema);
