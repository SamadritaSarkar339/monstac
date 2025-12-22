import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["dm"], default: "dm" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }], // 2 users
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    lastMessageFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // unread counters per userId (simple MVP)
    unread: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", ConversationSchema);