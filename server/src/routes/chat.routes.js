import express from "express";
import { auth } from "../middleware/auth.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

function dmKey(a, b) {
  return [a, b].sort().join(":");
}

router.get("/office", auth, async (req, res) => {
  const msgs = await Message.find({ kind: "office" })
    .populate("from", "name avatar status")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ messages: msgs.reverse() });
});

router.get("/room/:roomId", auth, async (req, res) => {
  const msgs = await Message.find({ kind: "room", roomId: req.params.roomId })
    .populate("from", "name avatar status")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ messages: msgs.reverse() });
});

router.get("/dm/:otherUserId", auth, async (req, res) => {
  const otherUserId = req.params.otherUserId;

  const me = await User.findById(req.user.id);
  if (!me?.connections?.some((id) => id.toString() === otherUserId)) {
    return res.status(403).json({ message: "DM allowed only after connection accepted" });
  }

  const key = dmKey(req.user.id, otherUserId);

  const msgs = await Message.find({ kind: "dm", dmKey: key })
    .populate("from", "name avatar status")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ messages: msgs.reverse(), dmKey: key });
});

export default router;