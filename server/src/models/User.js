import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: {
      style: { type: String, default: "classic" }, // can extend (3D/2D styles)
      color: { type: String, default: "#3b82f6" },
      mood: { type: String, default: "neutral" } // neutral/happy/tired/focused
    },
    status: { type: String, default: "available" } // available/focus/away/busy
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
