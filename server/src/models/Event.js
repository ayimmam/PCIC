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
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    scope: { type: String, enum: ["community", "domain"], default: "domain" },
    venue: { type: String, default: "" },
    endAt: { type: Date },
    timeZone: { type: String, default: "Africa/Addis_Ababa" },
    isPublished: { type: Boolean, default: false },
    ticketed: { type: Boolean, default: false },
    allowWalkIns: { type: Boolean, default: true },
    audienceYears: [{ type: Number, enum: [1, 2, 3, 4, 5] }],
    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reservationCount: { type: Number, default: 0, min: 0 },
    domain: {
      type: String,
      enum: ["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"],
      required: function () { return this.scope !== "community"; },
    },
    capacity: { type: Number, default: 0 },
    reportedAttendeeCount: { type: Number, default: null, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [attendeeSchema],
  },
  { timestamps: true }
);

eventSchema.index({ date: -1 });
eventSchema.index({ isPublished: 1, date: 1 });

export default mongoose.model("Event", eventSchema);
