/**
 * One-time script to upload project charter PDFs to Cloudinary.
 *
 * Prerequisites:
 *   1. Your server/.env must have CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *      CLOUDINARY_API_SECRET set.
 *   2. Run from the repo root:  node server/scripts/upload-charters.js
 *
 * Output: prints a JSON object mapping project slugs to Cloudinary URLs.
 *         Copy these URLs into the PROJECTS array in src/pages/PeakProjects.jsx.
 */
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// The .env may store the full cloudinary:// URL in CLOUDINARY_API_KEY.
// Extract the numeric key from it if so.
let apiKey = process.env.CLOUDINARY_API_KEY || "";
if (apiKey.startsWith("cloudinary://")) {
  // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  apiKey = apiKey.replace("cloudinary://", "").split(":")[0];
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: apiKey,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Map each charter filename to its project slug
const CHARTERS = [
  {
    slug: "telcom-customer-churn",
    file: "Telecom Customer Churn Prediction & Insights Project Charter.pdf",
  },
  {
    slug: "smart-resume-matching",
    file: "Smart Resume - Job Matching Project Charter .pdf",
  },
  {
    slug: "internship-readiness",
    file: "Internship Readiness Assessment & Recommendation System - Project Charter.pdf",
  },
  {
    slug: "group-assignment-coordination",
    file: "Group Assignment Coordination System - Project Charter.pdf",
  },
  {
    slug: "campus-event-rsvp",
    file: "Campus event & RSVP Project Charter .pdf",
  },
  {
    slug: "pcic-lms",
    file: "LMS Project Charter .pdf",
  },
  {
    slug: "fault-reporting",
    file: "Fault Reporting System - Project Charter  .pdf",
  },
];

const CHARTER_DIR = path.resolve(__dirname, "../../src/assets/Project charter");

async function main() {
  console.log("Uploading project charters to Cloudinary...\n");

  const results = {};

  for (const { slug, file } of CHARTERS) {
    const filePath = path.join(CHARTER_DIR, file);
    try {
      // Destroy existing resource first (may be authenticated type)
      try {
        await cloudinary.uploader.destroy(`pcic-charters/${slug}`, {
          resource_type: "raw",
          type: "authenticated",
        });
      } catch {
        // Ignore if doesn't exist
      }
      try {
        await cloudinary.uploader.destroy(`pcic-charters/${slug}`, {
          resource_type: "raw",
          type: "upload",
        });
      } catch {
        // Ignore if doesn't exist
      }

      const res = await cloudinary.uploader.upload(filePath, {
        folder: "pcic-charters",
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
        public_id: slug,
        overwrite: true,
      });
      results[slug] = res.secure_url;
      console.log(`✓ ${slug} → ${res.secure_url}`);
    } catch (err) {
      console.error(`✗ ${slug}: ${err.message}`);
      results[slug] = null;
    }
  }

  console.log("\n── Copy these into the PROJECTS array ──\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
