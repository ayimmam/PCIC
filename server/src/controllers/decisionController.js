import Decision from "../models/Decision.js";

export const getDecisions = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    const decisions = await Decision.find(filter)
      .populate("author", "name")
      .populate("timeline.changedBy", "name")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDecision = async (req, res) => {
  try {
    const { title, description, category, stakeholders } = req.body;
    const decision = await Decision.create({
      title,
      description,
      category,
      stakeholders,
      author: req.user._id,
      timeline: [{ status: "pending", changedBy: req.user._id, notes: "Created" }],
    });
    res.status(201).json(decision);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDecision = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    const { title, description, category, status, stakeholders, notes } = req.body;

    if (title) decision.title = title;
    if (description) decision.description = description;
    if (category) decision.category = category;
    if (stakeholders) decision.stakeholders = stakeholders;

    if (status && status !== decision.status) {
      decision.status = status;
      decision.timeline.push({
        status,
        changedBy: req.user._id,
        notes: notes || `Status changed to ${status}`,
      });
    }

    await decision.save();
    const populated = await decision.populate([
      { path: "author", select: "name" },
      { path: "timeline.changedBy", select: "name" },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
