import Decision from "../models/Decision.js";

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export const getDecisions = async (req, res) => {
  try {
    const { category, status, startDate, endDate, checkDate } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    const qStart = parseDate(startDate);
    const qEnd = parseDate(endDate);
    const qCheck = parseDate(checkDate);

    if (qCheck) {
      filter.category = { $in: ["exam-schedule", "holiday"] };
      filter.$or = [
        { startDate: { $lte: qCheck }, endDate: { $gte: qCheck } },
        { startDate: { $lte: qCheck }, endDate: null },
        { startDate: qCheck, endDate: null },
      ];
    } else if (qStart != null || qEnd != null) {
      filter.category = { $in: ["exam-schedule", "holiday"] };
      filter.$and = [];
      if (qStart != null) filter.$and.push({ $or: [{ endDate: { $gte: qStart } }, { endDate: null }] });
      if (qEnd != null) filter.$and.push({ startDate: { $lte: qEnd } });
      if (filter.$and.length === 0) delete filter.$and;
    }

    const decisions = await Decision.find(filter)
      .populate("author", "name")
      .populate("timeline.changedBy", "name")
      .populate("actionItems.assignee", "name email")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConflicts = async (req, res) => {
  try {
    const date = parseDate(req.query.date);
    if (!date) return res.status(400).json({ message: "Query 'date' (YYYY-MM-DD) is required" });

    const conflicts = await Decision.find({
      category: { $in: ["exam-schedule", "holiday"] },
      startDate: { $ne: null, $lte: date },
      $or: [{ endDate: { $gte: date } }, { endDate: null }],
    })
      .select("title category startDate endDate")
      .lean();

    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDecision = async (req, res) => {
  try {
    const { title, description, category, stakeholders, startDate, endDate, actionItems } = req.body;
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const items = Array.isArray(actionItems)
      ? actionItems
          .map((a) => ({
            task: a.task,
            assignee: a.assignee,
            dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
            status: a.status || "pending",
          }))
          .filter((a) => a.task && a.assignee && a.dueDate)
      : [];

    const decision = await Decision.create({
      title,
      description,
      category,
      stakeholders: stakeholders || [],
      startDate: start || undefined,
      endDate: end || undefined,
      author: req.user._id,
      timeline: [{ status: "pending", changedBy: req.user._id, notes: "Created" }],
      actionItems: items,
    });

    const populated = await decision.populate([
      { path: "author", select: "name" },
      { path: "timeline.changedBy", select: "name" },
      { path: "actionItems.assignee", select: "name email" },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDecision = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    const {
      title,
      description,
      category,
      status,
      stakeholders,
      notes,
      startDate,
      endDate,
      actionItems,
    } = req.body;

    if (title != null) decision.title = title;
    if (description != null) decision.description = description;
    if (category != null) decision.category = category;
    if (stakeholders != null) decision.stakeholders = stakeholders;
    if (startDate !== undefined) decision.startDate = parseDate(startDate) || null;
    if (endDate !== undefined) decision.endDate = parseDate(endDate) || null;

    if (Array.isArray(actionItems)) {
      decision.actionItems = actionItems.map((a) => ({
        task: a.task,
        assignee: a.assignee,
        dueDate: a.dueDate ? new Date(a.dueDate) : a.dueDate,
        status: a.status || "pending",
      }));
    }

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
      { path: "actionItems.assignee", select: "name email" },
    ]);
    const payload = populated.toObject ? populated.toObject() : populated;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
