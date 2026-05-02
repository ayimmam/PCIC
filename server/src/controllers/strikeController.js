import Strike from "../models/Strike.js";
import User from "../models/User.js";
import { sendStrikeEmail } from "../utils/email.js";

export const getStrikes = async (_req, res) => {
  try {
    const strikes = await Strike.find()
      .populate("memberId", "name email")
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.json(strikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberStrikes = async (req, res) => {
  try {
    const strikes = await Strike.find({ memberId: req.params.id })
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.json(strikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStrikeSummary = async (_req, res) => {
  try {
    const total = await Strike.countDocuments();
    const summary = await Strike.aggregate([
      { $group: { _id: "$memberId", count: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          membersWithStrikes: { $sum: 1 },
          maxStrikes: { $max: "$count" },
          totalStrikes: { $sum: "$count" },
        },
      },
    ]);

    res.json({
      total,
      membersWithStrikes: summary[0]?.membersWithStrikes || 0,
      maxStrikes: summary[0]?.maxStrikes || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignStrike = async (req, res) => {
  try {
    const { memberId, reason } = req.body;

    if (!memberId || !reason) {
      return res.status(400).json({ message: "Member and reason are required" });
    }

    const strike = await Strike.create({
      memberId,
      reason,
      assignedBy: req.user._id,
    });

    const totalStrikes = await Strike.countDocuments({ memberId });
    const user = await User.findById(memberId);

    if (totalStrikes >= 3 && !user.isFlagged) {
      user.status = "suspended";
      user.isFlagged = true;
      user.flagAssignedBy = req.user._id;
      user.dismissFlagRequested = false;
      await user.save();
    }

    if (user) {
      await sendStrikeEmail(user.email, user.name, reason, totalStrikes);
    }

    const populated = await strike.populate([
      { path: "memberId", select: "name email" },
      { path: "assignedBy", select: "name" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestDelete = async (req, res) => {
  try {
    const strike = await Strike.findById(req.params.id);
    if (!strike) return res.status(404).json({ message: "Strike not found" });

    // Ensure only the original assigner can request block
    if (strike.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only request deletion for strikes you assigned" });
    }

    strike.deleteRequested = true;
    await strike.save();

    res.json(strike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveDelete = async (req, res) => {
  try {
    const strike = await Strike.findById(req.params.id);
    if (!strike) return res.status(404).json({ message: "Strike not found" });

    const memberId = strike.memberId;
    await strike.deleteOne();

    const totalStrikes = await Strike.countDocuments({ memberId });
    const user = await User.findById(memberId);
    
    // Resume member if string drops below 3
    if (totalStrikes < 3 && user.status === "suspended") {
      user.status = "active"; // Revert to active or maybe a warning
      await user.save();
    }

    res.json({ message: "Strike deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestDismissFlag = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.flagAssignedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the person who assigned the flag can dismiss it" });
    }

    user.dismissFlagRequested = true;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveDismissFlag = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isFlagged = false;
    user.dismissFlagRequested = false;
    user.flagAssignedBy = null;
    user.status = "active";
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
