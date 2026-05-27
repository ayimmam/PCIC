import Event from "../models/Event.js";

const LEADERSHIP_ROLES = new Set(["president", "pm", "mc", "domain_leader", "event_organizer"]);

const getAttendanceSummary = (event) => {
  const total = event.attendees.length;
  const checkedIn = event.attendees.filter((attendee) => attendee.checkedIn).length;
  const remainingCapacity = event.capacity > 0 ? Math.max(event.capacity - checkedIn, 0) : null;

  return {
    total,
    checkedIn,
    capacity: event.capacity,
    capacityReached: event.capacity > 0 ? checkedIn >= event.capacity : false,
    remainingCapacity,
  };
};

export const getEvents = async (req, res) => {
  try {
    const { domain, timeframe } = req.query;
    const filter = {};

    if (domain) filter.domain = domain;
    if (timeframe === "upcoming") filter.date = { $gte: new Date() };
    if (timeframe === "past") filter.date = { $lt: new Date() };

    const events = await Event.find(filter)
      .populate("createdBy", "name")
      .populate("attendees.memberId", "name email")
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventCount = async (_req, res) => {
  try {
    const count = await Event.countDocuments();
    const upcoming = await Event.countDocuments({ date: { $gte: new Date() } });

    const attendanceAggregation = await Event.aggregate([
      {
        $project: {
          reportedAttendeeCount: { $ifNull: ["$reportedAttendeeCount", 0] },
          hasAttendanceReport: {
            $cond: [{ $ne: ["$reportedAttendeeCount", null] }, 1, 0],
          },
          checkedInCount: {
            $size: {
              $filter: {
                input: "$attendees",
                as: "attendee",
                cond: { $eq: ["$$attendee.checkedIn", true] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          reportedAttendeesTotal: { $sum: "$reportedAttendeeCount" },
          checkedInTotal: { $sum: "$checkedInCount" },
          eventsWithAttendanceReport: { $sum: "$hasAttendanceReport" },
        },
      },
    ]);

    const aggregate = attendanceAggregation[0] || {
      reportedAttendeesTotal: 0,
      checkedInTotal: 0,
      eventsWithAttendanceReport: 0,
    };

    const latestReportedEvent = await Event.findOne({ reportedAttendeeCount: { $ne: null } })
      .select("title date reportedAttendeeCount")
      .sort({ date: -1 });

    res.json({
      total: count,
      upcoming,
      reportedAttendeesTotal: aggregate.reportedAttendeesTotal,
      checkedInTotal: aggregate.checkedInTotal,
      eventsWithAttendanceReport: aggregate.eventsWithAttendanceReport,
      latestReportedEvent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, domain, capacity, reportedAttendeeCount } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      domain,
      capacity,
      reportedAttendeeCount:
        reportedAttendeeCount === "" || reportedAttendeeCount === undefined
          ? null
          : reportedAttendeeCount,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const allowedFields = ["title", "description", "date", "domain", "capacity", "reportedAttendeeCount"];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const memberId = req.body.memberId || req.user._id;
    const action = req.body.action;
    const overrideCapacity = Boolean(req.body.overrideCapacity);
    const isLeadership = LEADERSHIP_ROLES.has(req.user.role);
    const isSelfAction = memberId.toString() === req.user._id.toString();

    if (action && !["checkIn", "undo"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'checkIn' or 'undo'" });
    }

    if (!isSelfAction && !isLeadership) {
      return res.status(403).json({ message: "Only leadership can manage attendance for other members" });
    }

    const existing = event.attendees.find((a) => a.memberId.toString() === memberId.toString());
    const isCurrentlyCheckedIn = Boolean(existing?.checkedIn);

    let nextCheckedIn;
    if (action === "checkIn") {
      nextCheckedIn = true;
    } else if (action === "undo") {
      nextCheckedIn = false;
    } else {
      nextCheckedIn = !isCurrentlyCheckedIn;
    }

    const checkedInCount = event.attendees.filter((attendee) => attendee.checkedIn).length;
    const willIncreaseCheckedIn = !isCurrentlyCheckedIn && nextCheckedIn;
    const isAtCapacity = event.capacity > 0 && checkedInCount >= event.capacity;

    if (willIncreaseCheckedIn && isAtCapacity && !(isLeadership && overrideCapacity)) {
      return res.status(409).json({
        message: "Event capacity has been reached",
        requiresOverride: isLeadership,
      });
    }

    if (existing) {
      existing.checkedIn = nextCheckedIn;
      existing.checkedInAt = nextCheckedIn ? new Date() : null;
    } else {
      event.attendees.push({ memberId, checkedIn: nextCheckedIn, checkedInAt: nextCheckedIn ? new Date() : null });
    }

    await event.save();
    const populated = await event.populate("attendees.memberId", "name email");
    const response = populated.toObject();
    response.attendanceSummary = getAttendanceSummary(populated);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
