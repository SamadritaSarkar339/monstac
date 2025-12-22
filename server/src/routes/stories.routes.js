import express from "express";
import { auth } from "../middleware/auth.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `story_${Date.now()}_${nanoid(6)}${ext}`);
  }
});
const upload = multer({ storage });

// create text story
router.post("/text", auth, async (req, res) => {
  const { text } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ message: "Text required" });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const s = await Story.create({
    user: req.user.id,
    type: "text",
    text: text.trim(),
    expiresAt
  });

  res.json({ story: s });
});

// create image story
router.post("/image", auth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File required" });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const url = `/uploads/${req.file.filename}`;

  const s = await Story.create({
    user: req.user.id,
    type: "image",
    mediaUrl: url,
    expiresAt
  });

  res.json({ story: s });
});

// list active stories for me + my connections
router.get("/feed", auth, async (req, res) => {
  const me = await User.findById(req.user.id).select("connections");
  const ids = [req.user.id, ...(me?.connections || []).map((x) => x.toString())];

  const now = new Date();
  const stories = await Story.find({ user: { $in: ids }, expiresAt: { $gt: now } })
    .populate("user", "name avatar status")
    .sort({ createdAt: -1 });

  // group by user
  const grouped = {};
  for (const st of stories) {
    const uid = st.user._id.toString();
    if (!grouped[uid]) grouped[uid] = { user: st.user, stories: [] };
    grouped[uid].stories.push(st);
  }

  res.json({ groups: Object.values(grouped) });
});

export default router;