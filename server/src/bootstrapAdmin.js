import User from "./models/User.js";

export default async function bootstrapAdmin() {
  const email = "platform.admin.2026@pcic.tech";
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({
    name: "PCIC Platform Admin",
    email,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    role: "president",
    domain: "Code Crafters",
    batch: "batch_1",
    status: "active",
  });
}
