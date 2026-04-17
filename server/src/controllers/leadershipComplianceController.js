import LeadershipReport from "../models/LeadershipReport.js";
import User from "../models/User.js";
import { PCIC_DOMAINS } from "../constants/pcicDomains.js";

const VIEWER_ROLES = new Set(["president", "vice_president", "pm", "mc"]);

function semesterFromDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  if (month >= 1 && month <= 4) return `${year}-S1`;
  if (month >= 5 && month <= 8) return `${year}-S2`;
  return `${year}-S3`;
}

function currentSemester() {
  return semesterFromDate(new Date());
}

function mapComplianceStatus(submission) {
  if (!submission) return "non_compliant";
  return "compliant";
}

export const getDashboard = async (req, res) => {
  try {
    const availableSemesters = await LeadershipReport.distinct("semester");
    const current = currentSemester();
    if (!availableSemesters.includes(current)) availableSemesters.push(current);
    availableSemesters.sort((a, b) => b.localeCompare(a));

    const semester = String(req.query.semester || currentSemester()).trim();
    const isViewer = VIEWER_ROLES.has(req.user.role);

    const leaders = await User.find({ role: "domain_leader" })
      .select("name email role domain status")
      .sort({ domain: 1, name: 1 })
      .lean();

    const allSubmissions = await LeadershipReport.find({ semester })
      .populate("domainLeader", "name email domain")
      .populate("feedback.author", "name role")
      .sort({ submittedAt: -1 })
      .lean();

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

    res.json({ semester, availableSemesters, summary, rows });
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
    const semester = String(req.query.semester || currentSemester()).trim();

    if (!domainLeaderId) {
      return res.status(400).json({ message: "domainLeaderId is required" });
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
    const existing = await LeadershipReport.findById(req.params.id).select("_id").lean();
    if (!existing) {
      return res.status(404).json({ message: "Report not found" });
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