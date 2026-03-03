import Candidate from "../models/Candidate.js";
import User from "../models/User.js";
import Decision from "../models/Decision.js";
import { sendNewMemberNotification, sendPromotionRequestEmail } from "../utils/email.js";

export const getCandidates = async (_req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitApplication = async (req, res) => {
  try {
    const { motivation, requestedBatch } = req.body;

    const memberId = req.user?._id;
    if (!memberId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Prevent duplicate pending applications
    const existingPending = await Candidate.findOne({ member: memberId, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending promotion request" });
    }

    const allowedBatches = ["batch_1", "batch_2", "batch_3"];
    if (!requestedBatch || !allowedBatches.includes(requestedBatch)) {
      return res.status(400).json({ message: "Requested batch is invalid" });
    }

    const currentIndex = allowedBatches.indexOf(member.batch);
    const requestedIndex = allowedBatches.indexOf(requestedBatch);

    if (requestedIndex === -1 || requestedIndex <= currentIndex) {
      return res
        .status(400)
        .json({ message: "Requested batch must be higher than your current batch" });
    }

    const portfolioUrl = req.file?.path || "";
    if (!portfolioUrl) {
      return res.status(400).json({ message: "Portfolio PDF is required" });
    }

    const candidate = await Candidate.create({
      name: member.name,
      email: member.email,
      motivation,
      portfolioUrl,
      member: memberId,
      requestedBatch,
    });

    // Notify president(s) by email with deep link to /members
    try {
      const presidents = await User.find({ role: "president" }).select("email");
      const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
      const link = `${baseUrl}/members?candidateId=${candidate._id.toString()}`;
      const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

      for (const president of presidents) {
        await sendPromotionRequestEmail(
          president.email,
          member.name,
          batchLabels[member.batch] || member.batch,
          batchLabels[requestedBatch] || requestedBatch,
          link
        );
      }
    } catch (emailErr) {
      console.error("Promotion request email failed:", emailErr.message);
    }

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveCandidate = async (req, res) => {
  try {
    const { comment, requestedBatch } = req.body || {};

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const memberId = candidate.member;
    const member = memberId ? await User.findById(memberId) : await User.findOne({ email: candidate.email });

    if (!member) {
      return res.status(404).json({ message: "Linked member account not found" });
    }

    const targetBatch = candidate.requestedBatch || requestedBatch || member.batch;
    const allowedBatches = ["batch_1", "batch_2", "batch_3"];

    if (!allowedBatches.includes(targetBatch)) {
      return res.status(400).json({ message: "Target batch is invalid" });
    }

    const currentIndex = allowedBatches.indexOf(member.batch);
    const targetIndex = allowedBatches.indexOf(targetBatch);

    if (targetIndex <= currentIndex) {
      return res
        .status(400)
        .json({ message: "Target batch must be higher than current batch for approval" });
    }

    candidate.status = "approved";
    candidate.reviewedBy = req.user._id;
    candidate.reviewedAt = new Date();
    candidate.requestedBatch = targetBatch;
    await candidate.save();

    const previousBatch = member.batch;
    member.batch = targetBatch;
    await member.save();

    // Notify PM(s)
    try {
      const pms = await User.find({ role: "pm" }).select("email");
      for (const pm of pms) {
        await sendNewMemberNotification(pm.email, candidate.name);
      }
    } catch (emailErr) {
      console.error("PM notification failed:", emailErr.message);
    }

    // Log decision into the decision repository
    try {
      const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };
      const prettyFrom = batchLabels[previousBatch] || previousBatch;
      const prettyTo = batchLabels[targetBatch] || targetBatch;

      await Decision.create({
        title: `Promotion approved for ${candidate.name}`,
        description:
          comment ||
          `Promotion request for ${candidate.name} (candidate ${candidate._id}) from ${prettyFrom} to ${prettyTo} was approved.`,
        category: "membership",
        status: "implemented",
        stakeholders: [candidate.email],
        author: req.user._id,
        timeline: [
          {
            status: "implemented",
            changedBy: req.user._id,
            notes: `Promotion approved (candidateId=${candidate._id})`,
          },
        ],
      });
    } catch (decisionErr) {
      console.error("Failed to log promotion decision:", decisionErr.message);
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectCandidate = async (req, res) => {
  try {
    const { comment } = req.body || {};

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    candidate.status = "rejected";
    candidate.reviewedBy = req.user._id;
    candidate.reviewedAt = new Date();
    await candidate.save();

    // Log rejection into the decision repository
    try {
      await Decision.create({
        title: `Promotion rejected for ${candidate.name}`,
        description:
          comment ||
          `Promotion request for ${candidate.name} (candidate ${candidate._id}) was rejected by the president.`,
        category: "membership",
        status: "implemented",
        stakeholders: [candidate.email],
        author: req.user._id,
        timeline: [
          {
            status: "implemented",
            changedBy: req.user._id,
            notes: `Promotion rejected (candidateId=${candidate._id})`,
          },
        ],
      });
    } catch (decisionErr) {
      console.error("Failed to log rejection decision:", decisionErr.message);
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
