import multer from "multer";
import path from "node:path";
import configureCloudinary from "./cloudinaryConfig.js";
import sanitize from "../middleware/sanitize.js";

const allowed = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif"]);
const imageSignature = (buffer, extension) => {
  if (extension === ".png") return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (extension === ".jpg" || extension === ".jpeg") return buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
  if (extension === ".gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  return false;
};

const createUploader = (maxSize, extensions) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize, files: 1, fields: 12 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!extensions.has(extension)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
});

const upload = createUploader(1 * 1024 * 1024, allowed);
export const uploadSummerProject = createUploader(10 * 1024 * 1024, new Set([".pdf"]));
export const uploadLeadershipReport = createUploader(10 * 1024 * 1024, new Set([".pdf"]));

export const validateAndStoreFile = async (req, res, next) => {
  sanitize(req, res, () => {});
  if (!req.file) return next();
  try {
    const extension = path.extname(req.file.originalname).toLowerCase();
    const valid = extension === ".pdf"
      ? req.file.buffer.subarray(0, 5).toString("ascii") === "%PDF-"
      : imageSignature(req.file.buffer, extension);
    if (!valid) return res.status(400).json({ message: "File content does not match its type" });
    const cloudinary = configureCloudinary();
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "pcic-uploads", resource_type: "image",
        format: extension === ".pdf" ? "pdf" : undefined }, (error, result) => error ? reject(error) : resolve(result));
      stream.end(req.file.buffer);
    });
    req.file.path = uploaded.secure_url;
    req.file.cloudinaryPublicId = uploaded.public_id;
    return next();
  } catch (error) {
    console.error("Upload failed");
    return res.status(502).json({ message: "Unable to store file" });
  }
};

export default upload;
