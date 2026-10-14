import { v2 as cloudinary } from "cloudinary";

export default function configureCloudinary() {
  const rawKey = process.env.CLOUDINARY_API_KEY || "";
  if (rawKey.startsWith("cloudinary://")) {
    const parsed = new URL(rawKey);
    cloudinary.config({ cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username), api_secret: decodeURIComponent(parsed.password) });
    return cloudinary;
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !rawKey || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: rawKey, api_secret: process.env.CLOUDINARY_API_SECRET });
  return cloudinary;
}
