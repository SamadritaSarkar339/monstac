import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    status: { type: String, default: "available" }, // available/focus/busy/away
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Snapchat-like avatar data
    avatar: {
      avatarId: { type: String, default: "av-1" },
      color: { type: String, default: "#3b82f6" },
      mood: { type: String, default: "neutral" }, // neutral/happy/focused/tired
      outfitId: { type: String, default: "outfit-1" }, // NEW
      emojiStatus: { type: String, default: "💼" } // NEW
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);