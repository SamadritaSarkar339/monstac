import express from "express";
import { auth } from "../middleware/auth.js";
import ConnectionRequest from "../models/ConnectionRequest.js";
import User from "../models/User.js";

const router = express.Router();

// send request
router.post("/request", auth, async (req, res) => {
  const { toUserId } = req.body || {};
  if (!toUserId) return res.status(400).json({ message: "toUserId required" });
  if (toUserId === req.user.id) return res.status(400).json({ message: "Cannot request yourself" });

  // prevent requesting if already connected
  const me = await User.findById(req.user.id);
  if (me?.connections?.some((id) => id.toString() === toUserId)) {
    return res.status(409).json({ message: "Already connected" });
  }

  try {
    const reqDoc = await ConnectionRequest.create({ from: req.user.id, to: toUserId });
    res.json({ request: reqDoc });
  } catch (e) {
    // duplicate index etc.
    return res.status(409).json({ message: "Request already exists" });
  }
});

// list my incoming + outgoing
router.get("/requests", auth, async (req, res) => {
  const incoming = await ConnectionRequest.find({ to: req.user.id, status: "pending" })
    .populate("from", "-passwordHash")
    .sort({ createdAt: -1 });

  const outgoing = await ConnectionRequest.find({ from: req.user.id, status: "pending" })
    .populate("to", "-passwordHash")
    .sort({ createdAt: -1 });

  res.json({ incoming, outgoing });
});

// accept
router.post("/accept", auth, async (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ message: "requestId required" });

  const r = await ConnectionRequest.findById(requestId);
  if (!r) return res.status(404).json({ message: "Request not found" });
  if (r.to.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

  r.status = "accepted";
  await r.save();

  // add to both users' connections
  await User.updateOne({ _id: r.from }, { $addToSet: { connections: r.to } });
  await User.updateOne({ _id: r.to }, { $addToSet: { connections: r.from } });

  res.json({ ok: true });
});

// reject
router.post("/reject", auth, async (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ message: "requestId required" });

  const r = await ConnectionRequest.findById(requestId);
  if (!r) return res.status(404).json({ message: "Request not found" });
  if (r.to.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

  r.status = "rejected";
  await r.save();

  res.json({ ok: true });
});

export default router;