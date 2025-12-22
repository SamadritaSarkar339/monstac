import express from "express";
import { auth } from "../middleware/auth.js";
import { summarizeTranscript } from "../services/ai.service.js";

const router = express.Router();

router.post("/summarize", auth, async (req, res) => {
  const { transcript } = req.body || {};
  if (!transcript || transcript.trim().length < 10) {
    return res.status(400).json({ message: "Provide a transcript/text (min 10 chars)" });
  }

  const result = await summarizeTranscript(transcript);
  res.json(result);
});

export default router;
