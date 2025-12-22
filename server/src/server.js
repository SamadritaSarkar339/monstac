import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import usersRoutes from "./routes/users.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import conversationsRoutes from "./routes/conversations.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import storiesRoutes from "./routes/stories.routes.js";

import { setupPresence } from "./sockets/presence.socket.js";
import { setupWebRTC } from "./sockets/webrtc.socket.js";
import { setupChat } from "./sockets/chat.socket.js";

dotenv.config();

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // ✅ app must be created BEFORE app.use
app.use(express.json({ limit: "1mb" }));

// ✅ serve uploads AFTER app exists
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.get("/", (req, res) => res.json({ ok: true, name: "MONSTAC API" }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api/users", usersRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/chat", chatRoutes);

app.use("/api/conversations", conversationsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/stories", storiesRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }
});

setupPresence(io);
setupWebRTC(io);
setupChat(io);

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);
httpServer.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));