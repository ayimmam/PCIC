import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import { validPassword } from "../utils/passwordPolicy.js";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, sv: user.sessionVersion || 0 }, process.env.JWT_SECRET,
    { expiresIn: "7d", issuer: "pcic-api", audience: "pcic-web" });
};

const safeUser = (user) => {
  const value = user.toObject();
  delete value.password;
  delete value.resetTokenHash;
  delete value.resetTokenExpiresAt;
  return value;
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, domain, academicYear } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
        !validPassword(password) || !["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"].includes(domain) ||
        ![1, 2, 3, 4, 5].includes(Number(academicYear))) {
      return res.status(400).json({ message: "Enter a valid name, email, domain, academic year, and password of 8–10 characters" });
    }
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, password, domain,
      academicYear: Number(academicYear), role: "member", batch: "batch_1", status: "active",
    });
    res.status(201).json({ token: generateToken(user), user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "This email already has an account. Sign in instead." });
    console.error("Signup failed", error);
    res.status(500).json({ message: "Unable to create account" });
  }
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

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (["suspended", "inactive"].includes(user.status)) return res.status(403).json({ message: "Account access is unavailable" });

    if (user.mustResetPassword && Date.now() - user.createdAt.getTime() > TEMP_PASSWORD_EXPIRY_MS) {
      return res.status(401).json({
        message: "Your temporary password has expired. Contact a leadership member for a new one.",
      });
    }

    const token = generateToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, batch, domain } = req.body;
    if (!validPassword(password)) return res.status(400).json({ message: "Password must be 8–10 characters" });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role, batch, domain });
    const token = generateToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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
    if (!validPassword(newPassword)) {
      return res.status(400).json({ message: "New password must be 8–10 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.mustResetPassword) {
      return res.status(400).json({ message: "Onboarding has already been completed" });
    }

    // Store the first name only (e.g. "Abebe Kebede" -> "Abebe").
    user.name = String(fullName).trim();
    user.password = String(newPassword);
    user.mustResetPassword = false;
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const userObj = typeof req.user.toObject === "function" ? req.user.toObject() : { ...req.user };
    delete userObj.password;
    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
  res.json({ message: "Signed out" });
};

export const requestPasswordReset = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const response = { message: "If this account exists, a recovery email will be sent" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json(response);
  try {
    const user = await User.findOne({ email }).select("+resetTokenHash +resetTokenExpiresAt");
    if (user && process.env.SMTP_USER) {
      const raw = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const origin = process.env.APP_BASE_URL || "https://pcic.tech";
      await sendPasswordResetEmail(user.email, `${origin}/login?reset=${raw}`);
    }
  } catch (error) { console.error("Password reset request failed", error); }
  res.json(response);
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) || !validPassword(password)) {
    return res.status(400).json({ message: "Invalid recovery link or password" });
  }
  try {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpiresAt: { $gt: new Date() } })
      .select("+resetTokenHash +resetTokenExpiresAt");
    if (!user) return res.status(400).json({ message: "Recovery link expired or invalid" });
    user.password = password;
    user.mustResetPassword = false;
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();
    res.json({ message: "Password updated. Sign in again." });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to reset password" }); }
};
