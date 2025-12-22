import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["office", "room", "dm", "request"], required: true },

    // room messages
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

    // request chat
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ConnectionRequest", default: null },

    // DM chat
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },

    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // for dm convenience

    type: { type: String, enum: ["text", "image"], default: "text" },
    text: { type: String, default: "", trim: true },
    mediaUrl: { type: String, default: "" },

    // WhatsApp-like ticks
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("Message", MessageSchema);