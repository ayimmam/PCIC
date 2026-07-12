import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Temp passwords (seed-members.js) are only meant to bridge the gap until
// onboarding. Past this window, an un-onboarded account is treated as stale
// and login is blocked until an admin reissues a credential.
const TEMP_PASSWORD_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.mustResetPassword && Date.now() - user.createdAt.getTime() > TEMP_PASSWORD_EXPIRY_MS) {
      return res.status(401).json({
        message: "Your temporary password has expired. Contact a leadership member for a new one.",
      });
    }

    const token = generateToken(user._id);
    const { password: _, ...userData } = user.toObject();

    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, batch, domain } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role, batch, domain });
    const token = generateToken(user._id);
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * First-login onboarding. A member who logs in with the shared temporary
 * password (mustResetPassword === true) is locked to the onboarding screen
 * until they provide their full name and set a personal password.
 */
export const completeOnboarding = async (req, res) => {
  try {
    const { fullName, newPassword } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.mustResetPassword) {
      return res.status(400).json({ message: "Onboarding has already been completed" });
    }

    // Store the first name only (e.g. "Abebe Kebede" -> "Abebe").
    user.name = String(fullName).trim().split(/\s+/)[0];
    user.password = String(newPassword);
    user.mustResetPassword = false;
    await user.save();

    const token = generateToken(user._id);
    const { password: _, ...userData } = user.toObject();

    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const userObj = typeof req.user.toObject === "function" ? req.user.toObject() : { ...req.user };
    delete userObj.password;
    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
