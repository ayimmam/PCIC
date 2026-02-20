import Event from "../models/Event.js";

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
    res.json({ total: count, upcoming });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, domain, capacity } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      domain,
      capacity,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
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
    const existing = event.attendees.find((a) => a.memberId.toString() === memberId.toString());

    if (existing) {
      existing.checkedIn = !existing.checkedIn;
      existing.checkedInAt = existing.checkedIn ? new Date() : null;
    } else {
      event.attendees.push({ memberId, checkedIn: true, checkedInAt: new Date() });
    }

    await event.save();
    const populated = await event.populate("attendees.memberId", "name email");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
