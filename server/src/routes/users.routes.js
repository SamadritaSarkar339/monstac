import express from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// get my profile
router.get("/me", auth, async (req, res) => {
  const me = await User.findById(req.user.id).select("-passwordHash");
  res.json({ user: me });
});

// update my profile (avatar/mood etc.)
router.patch("/me", auth, async (req, res) => {
  const { avatar, status } = req.body || {};

  const updates = {};
  if (avatar) updates.avatar = avatar;
  if (status) updates.status = status;

  const me = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-passwordHash");
  res.json({ user: me });
});

export default router;