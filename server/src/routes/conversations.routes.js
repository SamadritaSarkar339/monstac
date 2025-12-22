import express from "express";
import { auth } from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ WhatsApp "Recent chats" list
// Returns conversations for logged in user, mapped to { otherUser, lastMessage, unreadCount }
router.get("/", auth, async (req, res) => {
  const meId = req.user.id;

  const convs = await Conversation.find({ participants: meId })
    .populate("participants", "name avatar status email")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  const mapped = convs.map((c) => {
    const other = c.participants.find((p) => p._id.toString() !== meId);
    const unreadCount = c.unread?.get(meId) || 0;

    return {
      _id: c._id,
      otherUser: other,
      lastMessageText: c.lastMessageText || "",
      lastMessageAt: c.lastMessageAt || null,
      unreadCount
    };
  });

  res.json({ conversations: mapped });
});

// ✅ WhatsApp "New chat" contacts list: show ONLY accepted connections
router.get("/dm-contacts", auth, async (req, res) => {
  const me = await User.findById(req.user.id)
    .populate("connections", "name email avatar status");

  res.json({ contacts: me?.connections || [] });
});

// ✅ Open/Create DM conversation ONLY if connected
router.post("/dm/:otherUserId", auth, async (req, res) => {
  const meId = req.user.id;
  const otherUserId = req.params.otherUserId;

  const me = await User.findById(meId).select("connections");
  const isConnected = me?.connections?.some((id) => id.toString() === otherUserId);
  if (!isConnected) return res.status(403).json({ message: "DM only after accept" });

  // find existing DM with exactly these two users
  let conv = await Conversation.findOne({
    kind: "dm",
    participants: { $all: [meId, otherUserId], $size: 2 }
  }).populate("participants", "name avatar status email");

  if (!conv) {
    conv = await Conversation.create({
      kind: "dm",
      participants: [meId, otherUserId],
      unread: { [meId]: 0, [otherUserId]: 0 }
    });

    conv = await Conversation.findById(conv._id).populate(
      "participants",
      "name avatar status email"
    );
  }

  res.json({ conversation: conv });
});

export default router;