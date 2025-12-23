import express from "express";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Get all users (except me)
router.get("/", auth, async (req, res) => {
  const meId = req.user.id;

  const users = await User.find({ _id: { $ne: meId } })
    .select("name email avatar status createdAt");

  res.json({ users });
});

export default router;
