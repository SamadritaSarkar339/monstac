import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { auth } from "../middleware/auth.js";
import Story from "../models/Story.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute directories: server/uploads/stories
const uploadsRoot = path.join(__dirname, "..", "..","..", "uploads");
const storiesDir = path.join(uploadsRoot, "stories");
fs.mkdirSync(storiesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storiesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    cb(null, `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ✅ POST text story
router.post("/text", auth, async (req, res) => {
  try {
    const { text, mood } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const story = await Story.create({
      user: req.user.id,
      kind: "text",
      text: String(text).trim(),
      mood: mood || "neutral",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.json({ story });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to post text story" });
  }
});

// ✅ POST image story (FormData field name must be "image")
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

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
    res.status(500).json({ message: e.message || "Failed to post image story" });
  }
});

// ✅ GET active stories
router.get("/", auth, async (req, res) => {
  const now = new Date();
  const stories = await Story.find({ expiresAt: { $gt: now } })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

  res.json({ stories });
});

export default router;
