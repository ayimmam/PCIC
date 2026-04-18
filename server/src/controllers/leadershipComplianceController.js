import LeadershipReport from "../models/LeadershipReport.js";
import SemesterConfig from "../models/SemesterConfig.js";
import User from "../models/User.js";
import { PCIC_DOMAINS } from "../constants/pcicDomains.js";

const VIEWER_ROLES = new Set(["president", "vice_president"]);
const COMPLIANCE_ROLES = ["president", "vice_president", "domain_leader"];

function normalizeBoolean(input, fallback = false) {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    if (input.toLowerCase() === "true") return true;
    if (input.toLowerCase() === "false") return false;
  }
  return fallback;
}

function mapSemesterConfig(item) {
  return {
    _id: item._id,
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    lockSubmissions: !!item.lockSubmissions,
    lockFeedback: !!item.lockFeedback,
  };
}

function pickDefaultSemester(configs) {
  if (!configs.length) return "";
  const active = configs.find((item) => item.status === "active");
  if (active) return active.name;
  return configs[0].name;
}

function mapComplianceStatus(submission) {
  if (!submission) return "non_compliant";
  return "compliant";
}

export const getDashboard = async (req, res) => {
  try {
    const semesterConfigs = await SemesterConfig.find({}).sort({ startDate: -1 }).lean();
    const availableSemesters = semesterConfigs.map((item) => item.name);
    const requestedSemester = String(req.query.semester || "").trim();
    const semester = requestedSemester || pickDefaultSemester(semesterConfigs);

    if (requestedSemester && !availableSemesters.includes(requestedSemester)) {
      return res.status(400).json({ message: "Selected semester is not configured" });
    }

    const isViewer = VIEWER_ROLES.has(req.user.role);

    const leaders = await User.find({ role: "domain_leader" })
      .select("name email role domain status")
      .sort({ domain: 1, name: 1 })
      .lean();

    const allSubmissions = semester
      ? await LeadershipReport.find({ semester })
          .populate("domainLeader", "name email domain")
          .populate("feedback.author", "name role")
          .sort({ submittedAt: -1 })
          .lean()
      : [];

    const submissionsByLeader = new Map();
    for (const item of allSubmissions) {
      const key = item.domainLeader?._id?.toString() || item.domainLeader?.toString();
      if (!key) continue;
      if (!submissionsByLeader.has(key)) submissionsByLeader.set(key, []);
      submissionsByLeader.get(key).push(item);
    }

    let rows = leaders.map((leader) => {
      const leaderSubmissions = submissionsByLeader.get(leader._id.toString()) || [];
      const submission = leaderSubmissions[0] || null;
      const status = mapComplianceStatus(submission);

      return {
        domain: leader.domain,
        domainLeader: {
          _id: leader._id,
          name: leader.name,
          email: leader.email,
          status: leader.status,
        },
        semester,
        status,
        submission: submission
          ? {
              _id: submission._id,
              reportTitle: submission.reportTitle,
              description: submission.description || submission.summary || "",
              fileUrl: submission.fileUrl || "",
              notes: submission.notes,
              evidenceUrl: submission.evidenceUrl,
              submittedAt: submission.submittedAt,
              version: submission.version,
              feedback: (submission.feedback || []).map((item) => ({
                _id: item._id,
                message: item.message,
                createdAt: item.createdAt,
                author: item.author
                  ? {
                      _id: item.author._id,
                      name: item.author.name,
                      role: item.author.role,
                    }
                  : null,
              })),
            }
          : null,
      };
    });

    const assignedDomains = new Set(leaders.map((leader) => leader.domain));
    const unassigned = PCIC_DOMAINS.filter((domain) => !assignedDomains.has(domain)).map((domain) => ({
      domain,
      domainLeader: null,
      semester,
      status: "unassigned",
      submission: null,
    }));

    rows = [...rows, ...unassigned];

    if (!isViewer && req.user.role === "domain_leader") {
      rows = rows.filter((row) => row.domainLeader?._id?.toString() === req.user._id.toString());
    }

    const summary = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "compliant") acc.compliant += 1;
        if (row.status === "non_compliant") acc.nonCompliant += 1;
        if (row.status === "unassigned") acc.unassigned += 1;
        return acc;
      },
      { total: 0, compliant: 0, nonCompliant: 0, unassigned: 0 }
    );

    res.json({
      semester,
      availableSemesters,
      semesterConfigs: semesterConfigs.map(mapSemesterConfig),
      semesterConfigRequired: semesterConfigs.length === 0,
      summary,
      rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitReport = async (req, res) => {
  try {
    if (req.user.role !== "domain_leader") {
      return res.status(403).json({ message: "Only domain leaders can submit compliance reports" });
    }

    const { semester, reportTitle, description, summary, notes, evidenceUrl } = req.body;
    const normalizedDescription = String(description || summary || "").trim();
    const fileUrl = req.file?.filename ? `uploads/${req.file.filename}` : "";

    if (!fileUrl) {
      return res.status(400).json({ message: "A PDF report file is required" });
    }

    if (!semester) {
      return res.status(400).json({ message: "semester is required" });
    }

    const normalizedSemester = String(semester).trim();
    const semesterConfig = await SemesterConfig.findOne({ name: normalizedSemester }).lean();
    if (!semesterConfig) {
      return res.status(400).json({ message: "Selected semester is not configured" });
    }

    if (semesterConfig.status === "closed" || semesterConfig.lockSubmissions) {
      return res.status(403).json({ message: "Submissions are locked for this semester" });
    }

    const previous = await LeadershipReport.findOne({
      domainLeader: req.user._id,
      semester: normalizedSemester,
      isLatest: true,
    }).sort({ version: -1 });

    const nextVersion = previous ? previous.version + 1 : 1;
    if (previous) {
      await LeadershipReport.updateOne(
        { _id: previous._id },
        { $set: { isLatest: false } }
      );
    }

    const report = await LeadershipReport.create({
      domainLeader: req.user._id,
      domain: req.user.domain,
      semester: normalizedSemester,
      reportTitle: String(reportTitle || req.file?.originalname || "Leadership report").trim(),
      description: normalizedDescription,
      fileUrl,
      notes: notes || "",
      evidenceUrl: evidenceUrl || "",
      submittedAt: new Date(),
      version: nextVersion,
      isLatest: true,
    });

    const populated = await report.populate("domainLeader", "name email domain");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubmissionHistory = async (req, res) => {
  try {
    const domainLeaderId = String(req.query.domainLeaderId || "").trim();
    const semester = String(req.query.semester || "").trim();

    if (!domainLeaderId) {
      return res.status(400).json({ message: "domainLeaderId is required" });
    }

    if (!semester) {
      return res.status(400).json({ message: "semester is required" });
    }

    const semesterConfig = await SemesterConfig.findOne({ name: semester }).lean();
    if (!semesterConfig) {
      return res.status(400).json({ message: "Selected semester is not configured" });
    }

    if (req.user.role === "domain_leader" && req.user._id.toString() !== domainLeaderId) {
      return res.status(403).json({ message: "You can only view your own submission history" });
    }

    const items = await LeadershipReport.find({
      domainLeader: domainLeaderId,
      semester,
    })
      .populate("domainLeader", "name email domain")
      .populate("feedback.author", "name role")
      .sort({ submittedAt: -1 })
      .lean();

    const history = items.map((entry) => ({
      _id: entry._id,
      reportTitle: entry.reportTitle,
      description: entry.description || entry.summary || "",
      notes: entry.notes || "",
      evidenceUrl: entry.evidenceUrl || "",
      fileUrl: entry.fileUrl || "",
      submittedAt: entry.submittedAt,
      version: entry.version,
      isLatest: !!entry.isLatest,
      feedback: (entry.feedback || []).map((item) => ({
        _id: item._id,
        message: item.message,
        createdAt: item.createdAt,
        author: item.author
          ? {
              _id: item.author._id,
              name: item.author.name,
              role: item.author.role,
            }
          : null,
      })),
    }));

    const leader = items[0]?.domainLeader
      ? {
          _id: items[0].domainLeader._id,
          name: items[0].domainLeader.name,
          email: items[0].domainLeader.email,
          domain: items[0].domainLeader.domain,
        }
      : null;

    res.json({ semester, domainLeader: leader, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFeedback = async (req, res) => {
  try {
    const existing = await LeadershipReport.findById(req.params.id).select("_id semester").lean();
    if (!existing) {
      return res.status(404).json({ message: "Report not found" });
    }

    const semesterConfig = await SemesterConfig.findOne({ name: existing.semester }).lean();
    if (semesterConfig && (semesterConfig.status === "closed" || semesterConfig.lockFeedback)) {
      return res.status(403).json({ message: "Feedback is locked for this semester" });
    }

    const message = String(req.body.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    await LeadershipReport.updateOne(
      { _id: req.params.id },
      {
        $push: {
          feedback: {
            author: req.user._id,
            message,
            createdAt: new Date(),
          },
        },
      }
    );

    const populated = await LeadershipReport.findById(req.params.id)
      .populate("domainLeader", "name email domain")
      .populate("feedback.author", "name role")
      .lean();

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSemesters = async (_req, res) => {
  try {
    const items = await SemesterConfig.find({}).sort({ startDate: -1 }).lean();
    res.json({ items: items.map(mapSemesterConfig) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSemester = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    const status = String(req.body.status || "planned").trim();
    const lockSubmissions = normalizeBoolean(req.body.lockSubmissions, false);
    const lockFeedback = normalizeBoolean(req.body.lockFeedback, false);

    if (!name || !startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "name, startDate, and endDate are required" });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ message: "startDate must be earlier than endDate" });
    }

    if (!["planned", "active", "closed"].includes(status)) {
      return res.status(400).json({ message: "status must be planned, active, or closed" });
    }

    if (status === "active") {
      await SemesterConfig.updateMany({ status: "active" }, { $set: { status: "planned" } });
    }

    const item = await SemesterConfig.create({
      name,
      startDate,
      endDate,
      status,
      lockSubmissions,
      lockFeedback,
      createdBy: req.user._id,
    });

    res.status(201).json(mapSemesterConfig(item.toObject()));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Semester name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const existing = await SemesterConfig.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Semester not found" });
    }

    const updates = {};

    if (req.body.name !== undefined) updates.name = String(req.body.name || "").trim();
    if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
    if (req.body.status !== undefined) updates.status = String(req.body.status || "").trim();
    if (req.body.lockSubmissions !== undefined) {
      updates.lockSubmissions = normalizeBoolean(req.body.lockSubmissions, existing.lockSubmissions);
    }
    if (req.body.lockFeedback !== undefined) {
      updates.lockFeedback = normalizeBoolean(req.body.lockFeedback, existing.lockFeedback);
    }

    const startDate = updates.startDate || existing.startDate;
    const endDate = updates.endDate || existing.endDate;
    if (!startDate || !endDate || Number.isNaN(new Date(startDate).getTime()) || Number.isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ message: "startDate and endDate must be valid dates" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "startDate must be earlier than endDate" });
    }

    if (updates.status && !["planned", "active", "closed"].includes(updates.status)) {
      return res.status(400).json({ message: "status must be planned, active, or closed" });
    }

    if (updates.status === "active") {
      await SemesterConfig.updateMany(
        { _id: { $ne: existing._id }, status: "active" },
        { $set: { status: "planned" } }
      );
    }

    Object.assign(existing, updates);
    await existing.save();

    res.json(mapSemesterConfig(existing.toObject()));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Semester name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

export { COMPLIANCE_ROLES };