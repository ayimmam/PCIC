import mongoose from "mongoose";
import Project from "../models/Project.js";
import WeeklyReport from "../models/WeeklyReport.js";
import ProjectResource from "../models/ProjectResource.js";
import ProjectIssue from "../models/ProjectIssue.js";
import User from "../models/User.js";

/* ── helpers ─────────────────────────────────────────── */

function isMemberOrPm(project, userId, userRole) {
  if (userRole === "pm") return true;
  const uid = userId.toString();
  if (project.projectLead && project.projectLead.toString() === uid) return true;
  return project.members.some((m) => (m._id || m).toString() === uid);
}

const populateProject = [
  { path: "projectLead", select: "name email batch domain" },
  { path: "members", select: "name email batch domain" },
  { path: "createdBy", select: "name" },
  { path: "todos.assignee", select: "name email" },
  { path: "todos.createdBy", select: "name" },
];

const allowedProjectBatches = ["batch_2", "batch_3"];

async function validateProjectTeamAssignments(memberIds = [], projectLead) {
  const allIds = [
    ...new Set([
      ...memberIds.filter(Boolean).map((id) => id.toString()),
      ...(projectLead ? [projectLead.toString()] : []),
    ]),
  ];

  if (allIds.length === 0) return;

  const users = await User.find({ _id: { $in: allIds } }).select("_id batch name").lean();
  if (users.length !== allIds.length) {
    throw new Error("One or more selected members were not found");
  }

  const invalid = users.find((user) => !allowedProjectBatches.includes(user.batch));
  if (invalid) {
    throw new Error("Only batch 2 and batch 3 members can be assigned to projects");
  }
}

/* ── projects CRUD ───────────────────────────────────── */

export const getProjects = async (req, res) => {
  try {
    const filter = req.user.role === "pm" ? {} : { members: req.user._id };
    const projects = await Project.find(filter)
      .populate(populateProject)
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(populateProject).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMemberOrPm(project, req.user._id, req.user.role)) {
      return res.status(403).json({ message: "Not a member of this project" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, deadline, projectLead, members, todos } = req.body;
    const memberIds = Array.isArray(members) ? members.filter(Boolean) : [];
    await validateProjectTeamAssignments(memberIds, projectLead);

    const wbsTodos = Array.isArray(todos)
      ? todos.map((t) => ({
          task: t.task,
          assignee: t.assignee || null,
          isWBS: true,
          createdBy: req.user._id,
        }))
      : [];

    const project = await Project.create({
      title,
      description,
      deadline: new Date(deadline),
      projectLead: projectLead || null,
      members: memberIds,
      createdBy: req.user._id,
      todos: wbsTodos,
    });

    const populated = await project.populate(populateProject);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { title, description, deadline, projectLead, members, status } = req.body;
    const nextMembers = Array.isArray(members) ? members.filter(Boolean) : project.members;
    const nextLead = projectLead !== undefined ? projectLead || null : project.projectLead;

    if (Array.isArray(members) || projectLead !== undefined) {
      await validateProjectTeamAssignments(nextMembers, nextLead);
    }

    if (title != null) project.title = title;
    if (description != null) project.description = description;
    if (deadline != null) project.deadline = new Date(deadline);
    if (projectLead !== undefined) project.projectLead = projectLead || null;
    if (Array.isArray(members)) project.members = nextMembers;
    if (status) project.status = status;

    await project.save();
    const populated = await project.populate(populateProject);
    res.json(populated);
  } catch (error) {
    const isValidationError =
      error.message === "One or more selected members were not found" ||
      error.message === "Only batch 2 and batch 3 members can be assigned to projects";
    res.status(isValidationError ? 400 : 500).json({ message: error.message });
  }
};

/* ── repo URL (project lead only) ───────────────────── */

export const setRepoUrl = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isLead =
      project.projectLead && project.projectLead.toString() === req.user._id.toString();
    const isPm = req.user.role === "pm";
    if (!isLead && !isPm) {
      return res.status(403).json({ message: "Only the project lead can set the repo URL" });
    }

    project.repoUrl = req.body.repoUrl || "";
    await project.save();
    res.json({ repoUrl: project.repoUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── todos ───────────────────────────────────────────── */

export const addTodo = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMemberOrPm(project, req.user._id, req.user.role)) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const { task, assignee } = req.body;
    project.todos.push({
      task,
      assignee: assignee || null,
      createdBy: req.user._id,
    });
    await project.save();
    const populated = await project.populate(populateProject);
    res.status(201).json(populated.todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMemberOrPm(project, req.user._id, req.user.role)) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const todo = project.todos.id(req.params.todoId);
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    if (req.body.status) {
      todo.status = req.body.status;
      if (req.body.status === "done" && !todo.completedAt) {
        todo.completedAt = new Date();
      } else if (req.body.status !== "done") {
        todo.completedAt = null;
      }
    }
    if (req.body.task != null) todo.task = req.body.task;
    if (req.body.assignee !== undefined) todo.assignee = req.body.assignee || null;

    await project.save();
    const populated = await project.populate(populateProject);
    res.json(populated.todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── weekly reports ──────────────────────────────────── */

export const getReports = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMemberOrPm(project, req.user._id, req.user.role)) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const reports = await WeeklyReport.find({ project: req.params.id })
      .populate("submittedBy", "name email")
      .populate("scoredBy", "name")
      .sort({ weekNumber: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMemberOrPm(project, req.user._id, req.user.role)) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const { weekNumber, summary } = req.body;
    const report = await WeeklyReport.create({
      project: req.params.id,
      weekNumber,
      summary,
      submittedBy: req.user._id,
    });

    const populated = await report.populate([
      { path: "submittedBy", select: "name email" },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scoreReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.qualityScore = req.body.qualityScore;
    report.scoredBy = req.user._id;
    await report.save();

    const populated = await report.populate([
      { path: "submittedBy", select: "name email" },
      { path: "scoredBy", select: "name" },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── resources ───────────────────────────────────────── */

export const getResources = async (req, res) => {
  try {
    const resources = await ProjectResource.find({ project: req.params.id })
      .populate("sharedBy", "name")
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addResource = async (req, res) => {
  try {
    const { title, url } = req.body;
    const resource = await ProjectResource.create({
      project: req.params.id,
      title,
      url,
      sharedBy: req.user._id,
    });

    const populated = await resource.populate("sharedBy", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── issues ──────────────────────────────────────────── */

export const getIssues = async (req, res) => {
  try {
    const issues = await ProjectIssue.find({ project: req.params.id })
      .populate("createdBy", "name email")
      .populate("messages.sender", "name email")
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createIssue = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const issue = await ProjectIssue.create({
      project: req.params.id,
      subject,
      createdBy: req.user._id,
      messages: [{ sender: req.user._id, content }],
    });

    const populated = await issue.populate([
      { path: "createdBy", select: "name email" },
      { path: "messages.sender", select: "name email" },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyIssue = async (req, res) => {
  try {
    const issue = await ProjectIssue.findById(req.params.issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    issue.messages.push({ sender: req.user._id, content: req.body.content });
    if (req.body.resolve) issue.status = "resolved";
    await issue.save();

    const populated = await issue.populate([
      { path: "createdBy", select: "name email" },
      { path: "messages.sender", select: "name email" },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── burndown ────────────────────────────────────────── */

export const getBurndown = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const totalTasks = project.todos.length;
    const startDate = new Date(project.createdAt);
    const endDate = new Date(project.deadline);
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000));

    // Build daily actual remaining tasks from completedAt timestamps
    const completions = project.todos
      .filter((t) => t.completedAt)
      .map((t) => new Date(t.completedAt))
      .sort((a, b) => a - b);

    const data = [];
    const now = new Date();
    const plotEnd = now < endDate ? now : endDate;
    const plotDays = Math.ceil((plotEnd - startDate) / 86400000);

    for (let d = 0; d <= plotDays; d++) {
      const dayDate = new Date(startDate.getTime() + d * 86400000);
      const dayStr = dayDate.toISOString().slice(0, 10);
      const ideal = Math.max(0, totalTasks - (totalTasks / totalDays) * d);
      const done = completions.filter((c) => c <= dayDate).length;
      data.push({
        day: dayStr,
        ideal: Math.round(ideal * 10) / 10,
        actual: totalTasks - done,
      });
    }

    res.json({ totalTasks, startDate, endDate, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBurndownSummary = async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" }).lean();

    const summary = projects.map((p) => {
      const total = p.todos.length;
      const done = p.todos.filter((t) => t.status === "done").length;
      return {
        _id: p._id,
        title: p.title,
        totalTasks: total,
        completedTasks: done,
        remaining: total - done,
        deadline: p.deadline,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
