import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    text: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

StorySchema.index({ expiresAt: 1 });

export default mongoose.model("Story", StorySchema);