import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  // Global limit – individual routes can further restrict this if needed
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});

const summerPdfFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only .pdf files are accepted for summer project upload"), false);
  }
};

/** Multer for Batch 1 summer project PDFs (larger limit than generic upload). */
export const uploadSummerProject = multer({
  storage,
  fileFilter: summerPdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const leadershipPdfFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only .pdf files are accepted for leadership compliance uploads"), false);
  }
};

/** Multer for leadership compliance PDFs. */
export const uploadLeadershipReport = multer({
  storage,
  fileFilter: leadershipPdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default upload;
