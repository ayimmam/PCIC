import Strike from "../models/Strike.js";

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

    const populated = await strike.populate([
      { path: "memberId", select: "name email" },
      { path: "assignedBy", select: "name" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
