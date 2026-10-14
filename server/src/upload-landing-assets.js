import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import configureCloudinary from "./utils/cloudinaryConfig.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(here, "../../client/public/report");
const names = ["semester-kickoff", "project-meetup", "women-at-peak", "ai-outreach", "domain-session"];
const cloudinary = configureCloudinary();

for (const name of names) {
  const file = path.join(sourceDir, `${name}.jpg`);
  if (!fs.existsSync(file)) throw new Error(`Missing prepared image: ${name}`);
  const result = await cloudinary.uploader.upload(file, { public_id: `pcic/public/landing/2026/${name}`,
    resource_type: "image", overwrite: true, unique_filename: false, invalidate: true });
  console.log(`${name}: ${result.secure_url}`);
}
console.log(`Set VITE_CLOUDINARY_CLOUD_NAME=${process.env.CLOUDINARY_CLOUD_NAME} in the frontend build environment, then rebuild and deploy.`);
