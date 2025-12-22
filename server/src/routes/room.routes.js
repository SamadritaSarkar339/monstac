import express from "express";
import crypto from "crypto";
import Room from "../models/Room.js";
import Note from "../models/Note.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

function makeCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g., A1B2C3
}

router.get("/", auth, async (req, res) => {
  const rooms = await Room.find({ members: req.user.id }).sort({ updatedAt: -1 });
  res.json({ rooms });
});

router.post("/", auth, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: "Room name required" });

  let code = makeCode();
  while (await Room.exists({ code })) code = makeCode();

  const room = await Room.create({
    name,
    code,
    createdBy: req.user.id,
    members: [req.user.id]
  });

  res.json({ room });
});

router.post("/join", auth, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ message: "Code required" });

  const room = await Room.findOne({ code: code.toUpperCase().trim() });
  if (!room) return res.status(404).json({ message: "Room not found" });

  if (!room.members.includes(req.user.id)) {
    room.members.push(req.user.id);
    await room.save();
  }

  res.json({ room });
});

router.get("/:roomId/notes", auth, async (req, res) => {
  const notes = await Note.find({ roomId: req.params.roomId }).sort({ createdAt: -1 }).limit(20);
  res.json({ notes });
});

router.post("/:roomId/notes", auth, async (req, res) => {
  const { title, transcript, summary, actionItems } = req.body || {};
  const note = await Note.create({
    roomId: req.params.roomId,
    createdBy: req.user.id,
    title: title || "Meeting Notes",
    transcript: transcript || "",
    summary: summary || "",
    actionItems: Array.isArray(actionItems) ? actionItems : []
  });
  res.json({ note });
});

export default router;
