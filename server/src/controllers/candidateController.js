import Candidate from "../models/Candidate.js";
import User from "../models/User.js";
import { sendNewMemberNotification } from "../utils/email.js";

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
    const { name, email, motivation } = req.body;
    const portfolioUrl = req.files?.portfolio?.[0]?.path || "";
    const resumeUrl = req.files?.resume?.[0]?.path || "";

    const candidate = await Candidate.create({
      name,
      email,
      motivation,
      portfolioUrl,
      resumeUrl,
    });

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    candidate.status = "approved";
    candidate.reviewedBy = req.user._id;
    candidate.reviewedAt = new Date();
    await candidate.save();

    // Notify PM(s)
    try {
      const pms = await User.find({ role: "pm" }).select("email");
      for (const pm of pms) {
        await sendNewMemberNotification(pm.email, candidate.name);
      }
    } catch (emailErr) {
      console.error("PM notification failed:", emailErr.message);
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    candidate.status = "rejected";
    candidate.reviewedBy = req.user._id;
    candidate.reviewedAt = new Date();
    await candidate.save();

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
