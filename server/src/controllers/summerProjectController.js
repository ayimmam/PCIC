import mongoose from "mongoose";
import SummerProjectSubmission from "../models/SummerProjectSubmission.js";
import User from "../models/User.js";
import Decision from "../models/Decision.js";

const activeCycle = () => process.env.SUMMER_PROJECT_CYCLE || "summer-2026";

async function logSummerDecision({ title, description, authorId }) {
  try {
    await Decision.create({
      title,
      description,
      category: "membership",
      status: "implemented",
      stakeholders: [],
      author: authorId,
      timeline: [
        {
          status: "implemented",
          changedBy: authorId,
          notes: "Summer project review",
        },
      ],
    });
  } catch (err) {
    console.error("Summer project decision log failed:", err.message);
  }
}

export const getMine = async (req, res) => {
  try {
    const cycle = activeCycle();
    const [submission] = await SummerProjectSubmission.find({
      student: req.user._id,
      academicCycle: cycle,
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate("gradedBy", "name");

    res.json(submission || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listPendingForGrader = async (req, res) => {
  try {
    const graderDomain = req.user.domain;
    const submissions = await SummerProjectSubmission.find({
      status: "pending",
      academicCycle: activeCycle(),
    })
      .populate("student", "name email domain batch role")
      .sort({ createdAt: 1 });

    const filtered = submissions.filter(
      (s) => s.student && String(s.student.domain) === String(graderDomain)
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitSubmission = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);
    if (!member) {
      return res.status(404).json({ message: "User not found" });
    }

    if (member.role !== "member") {
      return res.status(403).json({ message: "Only members can submit a summer project" });
    }

    if (member.batch !== "batch_1") {
      return res.status(403).json({ message: "Summer project upload is only for Batch 1 students" });
    }

    if (!member.domain || member.domain === "General") {
      return res.status(400).json({
        message:
          "Your profile domain is set to General. Ask the Membership Coordinator to assign your PCIC domain before uploading a summer project.",
      });
    }

    const cycle = activeCycle();
    const pending = await SummerProjectSubmission.findOne({
      student: member._id,
      academicCycle: cycle,
      status: "pending",
    });
    if (pending) {
      return res.status(400).json({ message: "You already have a pending summer project for this cycle" });
    }

    const passed = await SummerProjectSubmission.findOne({
      student: member._id,
      academicCycle: cycle,
      status: "passed",
    });
    if (passed) {
      return res.status(400).json({ message: "You have already passed the summer project for this cycle" });
    }

    const fileUrl = req.file?.path || "";
    if (!fileUrl) {
      return res.status(400).json({ message: "A PDF file is required" });
    }

    const { title = "", notes = "" } = req.body;

    const submission = await SummerProjectSubmission.create({
      student: member._id,
      fileUrl,
      title: String(title).trim(),
      notes: String(notes).trim(),
      academicCycle: cycle,
      status: "pending",
    });

    const populated = await SummerProjectSubmission.findById(submission._id).populate("gradedBy", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { verdict, comment } = req.body || {};
    if (!["pass", "fail"].includes(verdict)) {
      return res.status(400).json({ message: "verdict must be pass or fail" });
    }

    const submission = await SummerProjectSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "This submission has already been graded" });
    }

    const student = await User.findById(submission.student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (String(student.domain) !== String(req.user.domain)) {
      return res.status(403).json({ message: "You can only grade students in your domain" });
    }

    const gradeComment = comment != null ? String(comment).trim() : "";
    if (verdict === "fail" && !gradeComment) {
      return res.status(400).json({ message: "A short comment is required when marking as failed" });
    }

    if (verdict === "fail") {
      submission.status = "failed";
      submission.gradedBy = req.user._id;
      submission.gradedAt = new Date();
      submission.gradeComment = gradeComment;
      await submission.save();

      await logSummerDecision({
        title: `Summer project not passed — ${student.name}`,
        description:
          gradeComment ||
          `${student.name}'s summer project (${submission.academicCycle}) in domain ${student.domain} was marked as not passed.`,
        authorId: req.user._id,
      });

      const populated = await SummerProjectSubmission.findById(submission._id).populate("gradedBy", "name");
      return res.json(populated);
    }

    await mongoose.connection.transaction(async (session) => {
      const sub = await SummerProjectSubmission.findById(req.params.id).session(session);
      if (!sub || sub.status !== "pending") {
        throw new Error("Submission is no longer pending");
      }
      const mem = await User.findById(sub.student).session(session);
      sub.status = "passed";
      sub.gradedBy = req.user._id;
      sub.gradedAt = new Date();
      sub.gradeComment = gradeComment;
      if (mem && mem.batch === "batch_1") {
        mem.batch = "batch_2";
        await mem.save({ session });
      }
      await sub.save({ session });
    });

    await logSummerDecision({
      title: `Summer project passed — ${student.name}`,
      description:
        gradeComment ||
        `${student.name} passed the summer project (${submission.academicCycle}) in domain ${student.domain}. Promoted to Batch 2.`,
      authorId: req.user._id,
    });

    const populated = await SummerProjectSubmission.findById(req.params.id).populate("gradedBy", "name");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
