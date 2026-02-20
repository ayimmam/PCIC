import User from "../models/User.js";
import { sendWarningEmail } from "../utils/email.js";

export const getMembers = async (req, res) => {
  try {
    const { domain, batch, status, search } = req.query;
    const filter = {};

    if (domain) filter.domain = domain;
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const members = await User.find(filter).select("-password").sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberCount = async (_req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: "active" });
    const warning = await User.countDocuments({ status: "warning" });
    const inactive = await User.countDocuments({ status: "inactive" });
    res.json({ total, active, warning, inactive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const previousStatus = member.status;
    member.status = status;
    await member.save();

    if (status === "warning" && previousStatus !== "warning") {
      try {
        await sendWarningEmail(member.email, member.name);
      } catch (emailErr) {
        console.error("Warning email failed:", emailErr.message);
      }
    }

    const { password: _, ...memberData } = member.toObject();
    res.json(memberData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
