import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // must match routes
    kind: {
      type: String,
      enum: ["text", "image"],
      required: true
    },

    // text story
    text: {
      type: String,
      default: ""
    },
    mood: {
      type: String,
      default: "neutral"
    },

    // image story
    mediaUrl: {
      type: String,
      default: ""
    },
    caption: {
      type: String,
      default: ""
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

// auto-delete expired stories (24h)
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Story", StorySchema);
