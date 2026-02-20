import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    domain: {
      type: String,
      enum: ["T&G", "Technical", "Events", "Marketing", "Finance", "General"],
      required: true,
    },
    capacity: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [attendeeSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
