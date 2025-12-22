import express from "express";
import { auth } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const router = express.Router();

// get DM history
router.get("/dm/:conversationId", auth, async (req, res) => {
  const meId = req.user.id;
  const { conversationId } = req.params;

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });

  const allowed = conv.participants.some((p) => p.toString() === meId);
  if (!allowed) return res.status(403).json({ message: "Not allowed" });

  const msgs = await Message.find({ kind: "dm", conversationId })
    .populate("from", "name avatar status")
    .sort({ createdAt: 1 })
    .limit(200);

  res.json({ messages: msgs });
});

export default router;