import User from "../models/User.js";
import Strike from "../models/Strike.js";
import Event from "../models/Event.js";
import { sendWarningEmail } from "../utils/email.js";

/** Escape special regex characters to prevent ReDoS */
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getMembers = async (req, res) => {
  try {
    const { domain, batch, status, search } = req.query;
    const filter = {};

    if (domain) filter.domain = String(domain);
    if (batch) filter.batch = String(batch);
    if (status) filter.status = String(status);
    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const members = await User.find(filter).select("-password").sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberCount = async (_req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: "active" });
    const warning = await User.countDocuments({ status: "warning" });
    const inactive = await User.countDocuments({ status: "inactive" });
    res.json({ total, active, warning, inactive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const previousStatus = member.status;
    member.status = status;
    await member.save();

    if (status === "warning" && previousStatus !== "warning") {
      try {
        await sendWarningEmail(member.email, member.name);
      } catch (emailErr) {
        console.error("Warning email failed:", emailErr.message);
      }
    }

    const { password: _, ...memberData } = member.toObject();
    res.json(memberData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberBatch = async (req, res) => {
  try {
    const { batch } = req.body;
    const allowedBatches = ["batch_1", "batch_2", "batch_3"];

    if (!batch || !allowedBatches.includes(batch)) {
      return res.status(400).json({ message: "Invalid batch value" });
    }

    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.batch = batch;
    await member.save();

    const { password: _, ...memberData } = member.toObject();
    res.json(memberData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (name == null && email == null) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (name != null) member.name = String(name).trim();
    if (email != null) member.email = String(email).trim().toLowerCase();

    await member.save();

    const { password: _, ...memberData } = member.toObject();
    res.json(memberData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: error.message });
  }
};

/* ── Member self-service endpoints ─────────────────────────── */

export const getMyProfile = async (req, res) => {
  try {
    const userObj = typeof req.user.toObject === "function" ? req.user.toObject() : { ...req.user };
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyStrikes = async (req, res) => {
  try {
    const strikes = await Strike.find({ memberId: req.user._id })
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.json(strikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const events = await Event.find({ "attendees.memberId": req.user._id })
      .select("title date domain attendees")
      .sort({ date: -1 });

    const result = events.map((event) => {
      const myEntry = event.attendees.find(
        (a) => a.memberId.toString() === req.user._id.toString()
      );
      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        domain: event.domain,
        checkedIn: myEntry?.checkedIn || false,
        checkedInAt: myEntry?.checkedInAt || null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = String(name).trim();
    await user.save();

    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(String(currentPassword));
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = String(newPassword);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

