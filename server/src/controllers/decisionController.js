import mongoose from "mongoose";
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
      .populate("stakeholders", "name email")
      .populate("timeline.changedBy", "name")
      .populate("actionItems.assignees", "name email")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const decisions = await Decision.find({
      actionItems: {
        $elemMatch: {
          assignees: userId,
          status: "pending",
        },
      },
    })
      .select("title actionItems")
      .populate("actionItems.assignees", "name email")
      .sort({ "actionItems.dueDate": 1 })
      .lean();

    const tasks = [];
    for (const d of decisions) {
      if (!d.actionItems) continue;
      for (let i = 0; i < d.actionItems.length; i++) {
        const item = d.actionItems[i];
        const assigneeIds = (item.assignees || []).map((a) => (a && a._id ? a._id.toString() : a));
        if (!assigneeIds.includes(userId.toString())) continue;
        if (item.status !== "pending") continue;
        tasks.push({
          decisionId: d._id,
          decisionTitle: d.title,
          task: item.task,
          dueDate: item.dueDate,
          status: item.status,
          itemIndex: i,
        });
      }
    }
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDecisionById = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id)
      .populate("author", "name")
      .populate("stakeholders", "name email")
      .populate("timeline.changedBy", "name")
      .populate("actionItems.assignees", "name email")
      .lean();
    if (!decision) return res.status(404).json({ message: "Decision not found" });
    res.json(decision);
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

function normalizeActionItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((a) => {
      const assignees = Array.isArray(a.assignees)
        ? a.assignees.filter(Boolean)
        : a.assignee
          ? [a.assignee]
          : [];
      return {
        task: a.task,
        assignees,
        dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
        status: a.status || "pending",
      };
    })
    .filter((a) => a.task && a.assignees.length > 0 && a.dueDate);
}

export const createDecision = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      stakeholders: stakeholderIds,
      startDate,
      endDate,
      actionItems,
    } = req.body;
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const stakeholders = Array.isArray(stakeholderIds)
      ? stakeholderIds.filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      : [];

    const items = normalizeActionItems(actionItems);

    const decision = await Decision.create({
      title,
      description,
      category: (category && String(category).trim()) || "other",
      stakeholders,
      startDate: start || undefined,
      endDate: end || undefined,
      author: req.user._id,
      timeline: [{ status: "pending", changedBy: req.user._id, notes: "Created" }],
      actionItems: items,
    });

    const populated = await decision.populate([
      { path: "author", select: "name" },
      { path: "stakeholders", select: "name email" },
      { path: "timeline.changedBy", select: "name" },
      { path: "actionItems.assignees", select: "name email" },
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
    if (category != null) decision.category = String(category).trim();
    if (stakeholders != null) {
      decision.stakeholders = Array.isArray(stakeholders)
        ? stakeholders.filter((id) => id && mongoose.Types.ObjectId.isValid(id))
        : [];
    }
    if (startDate !== undefined) decision.startDate = parseDate(startDate) || null;
    if (endDate !== undefined) decision.endDate = parseDate(endDate) || null;

    if (Array.isArray(actionItems)) {
      decision.actionItems = normalizeActionItems(actionItems);
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
      { path: "stakeholders", select: "name email" },
      { path: "timeline.changedBy", select: "name" },
      { path: "actionItems.assignees", select: "name email" },
    ]);
    const payload = populated.toObject ? populated.toObject() : populated;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
