import User from "../models/User.js";
import Event from "../models/Event.js";
import Decision from "../models/Decision.js";
import Strike from "../models/Strike.js";
import Candidate from "../models/Candidate.js";
import Project from "../models/Project.js";

export const getReportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // ── Members ──────────────────────────────────────────────
    const [
      totalMembers,
      activeMembers,
      warningMembers,
      inactiveMembers,
      newRegistrations,
      membersByDomain,
      membersByBatch,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "warning" }),
      User.countDocuments({ status: "inactive" }),
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.aggregate([
        { $group: { _id: "$domain", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$batch", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const membersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Events ───────────────────────────────────────────────
    const eventsInRange = await Event.find({
      date: { $gte: start, $lte: end },
    })
      .select("title date domain attendees reportedAttendeeCount capacity")
      .sort({ date: -1 });

    const totalEvents = eventsInRange.length;

    const eventsByDomain = {};
    let totalCheckedIn = 0;
    let totalReportedAttendees = 0;
    const topEvents = [];

    for (const evt of eventsInRange) {
      const domain = evt.domain;
      eventsByDomain[domain] = (eventsByDomain[domain] || 0) + 1;

      const checkedIn = evt.attendees.filter((a) => a.checkedIn).length;
      totalCheckedIn += checkedIn;

      if (evt.reportedAttendeeCount != null) {
        totalReportedAttendees += evt.reportedAttendeeCount;
      }

      topEvents.push({
        title: evt.title,
        date: evt.date,
        domain,
        attendeeCount: checkedIn,
        reportedCount: evt.reportedAttendeeCount,
      });
    }

    topEvents.sort((a, b) => b.attendeeCount - a.attendeeCount);

    // ── Decisions ────────────────────────────────────────────
    const decisionsInRange = await Decision.find(dateFilter).select(
      "title category status"
    );
    const totalDecisions = decisionsInRange.length;

    const decisionsByCategory = {};
    const decisionsByStatus = {};
    for (const d of decisionsInRange) {
      decisionsByCategory[d.category] =
        (decisionsByCategory[d.category] || 0) + 1;
      decisionsByStatus[d.status] = (decisionsByStatus[d.status] || 0) + 1;
    }

    // ── Strikes ──────────────────────────────────────────────
    const strikesInRange = await Strike.find(dateFilter);
    const totalStrikes = strikesInRange.length;
    const uniqueStrikedMembers = new Set(
      strikesInRange.map((s) => s.memberId.toString())
    ).size;

    // ── Candidates ───────────────────────────────────────────
    const candidatesInRange = await Candidate.find(dateFilter).select("status");
    const totalCandidates = candidatesInRange.length;
    const candidatesByStatus = {};
    for (const c of candidatesInRange) {
      candidatesByStatus[c.status] = (candidatesByStatus[c.status] || 0) + 1;
    }

    // ── Projects ─────────────────────────────────────────────
    const projectsInRange = await Project.find(dateFilter).select(
      "title status todos"
    );
    const totalProjects = projectsInRange.length;
    const projectsByStatus = {};
    let totalTodos = 0;
    let completedTodos = 0;

    for (const p of projectsInRange) {
      projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
      if (p.todos && p.todos.length) {
        totalTodos += p.todos.length;
        completedTodos += p.todos.filter((t) => t.status === "done").length;
      }
    }

    // ── Response ─────────────────────────────────────────────
    res.json({
      dateRange: { startDate: start, endDate: end },
      members: {
        total: totalMembers,
        active: activeMembers,
        warning: warningMembers,
        inactive: inactiveMembers,
        newRegistrations,
        byDomain: membersByDomain,
        byBatch: membersByBatch,
        byRole: membersByRole,
      },
      events: {
        total: totalEvents,
        byDomain: eventsByDomain,
        totalCheckedIn,
        totalReportedAttendees,
        topEvents: topEvents.slice(0, 10),
      },
      decisions: {
        total: totalDecisions,
        byCategory: decisionsByCategory,
        byStatus: decisionsByStatus,
      },
      strikes: {
        total: totalStrikes,
        membersAffected: uniqueStrikedMembers,
      },
      candidates: {
        total: totalCandidates,
        byStatus: candidatesByStatus,
      },
      projects: {
        total: totalProjects,
        byStatus: projectsByStatus,
        totalTodos,
        completedTodos,
        todoCompletionRate:
          totalTodos > 0
            ? Math.round((completedTodos / totalTodos) * 100)
            : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
