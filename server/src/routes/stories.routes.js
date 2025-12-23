import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

import { auth } from "../middleware/auth.js";
import Story from "../models/Story.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ uploads directory (works on local + render ephemeral disk)
const uploadDir = path.join(__dirname, "..", "..", "uploads", "stories");
fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${nanoid(6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.mimetype);
    if (!ok) return cb(new Error("Only JPG/PNG/WEBP allowed"));
    cb(null, true);
  }
});

// ✅ POST image story
// IMPORTANT: frontend must send FormData key = "image"
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file uploaded" });

    const mediaUrl = `/uploads/stories/${req.file.filename}`;

    const story = await Story.create({
      user: req.user.id,
      kind: "image",
      mediaUrl,
      caption: req.body.caption || "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.json({ story });
  } catch (e) {
    res.status(500).json({ message: e.message || "Upload failed" });
  }
});

// ✅ list active stories
router.get("/", auth, async (req, res) => {
  const now = new Date();
  const stories = await Story.find({ expiresAt: { $gt: now } })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

  res.json({ stories });
});

export default router;
