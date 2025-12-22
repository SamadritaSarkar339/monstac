import mongoose from "mongoose";

const ConnectionRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

// prevent duplicates (same from-to)
ConnectionRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model("ConnectionRequest", ConnectionRequestSchema);