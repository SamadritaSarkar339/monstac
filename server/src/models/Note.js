import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Meeting Notes" },
    transcript: { type: String, default: "" },
    summary: { type: String, default: "" },
    actionItems: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model("Note", NoteSchema);
