import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"], issuer: "pcic-api", audience: "pcic-web" });
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (["suspended", "inactive"].includes(user.status)) return res.status(403).json({ message: "Account access is unavailable" });
    if ((decoded.sv || 0) !== (user.sessionVersion || 0)) return res.status(401).json({ message: "Session expired. Sign in again." });
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      return res.status(401).json({ message: "Session expired. Sign in again." });
    }
    if (user.mustResetPassword && req.path !== "/me" && req.path !== "/complete-onboarding" && req.path !== "/logout") {
      return res.status(403).json({ message: "Complete onboarding first" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
