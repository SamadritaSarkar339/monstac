import express from "express";
import { auth } from "../middleware/auth.js";
import ConnectionRequest from "../models/ConnectionRequest.js";
import Message from "../models/Message.js";

const router = express.Router();

// history for a request chat
router.get("/:requestId", auth, async (req, res) => {
  const { requestId } = req.params;

  const r = await ConnectionRequest.findById(requestId);
  if (!r) return res.status(404).json({ message: "Request not found" });

  const uid = req.user.id;
  const allowed = r.from.toString() === uid || r.to.toString() === uid;
  if (!allowed) return res.status(403).json({ message: "Not allowed" });

  const msgs = await Message.find({ kind: "request", requestId })
    .populate("from", "name avatar status")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ messages: msgs.reverse() });
});

export default router;