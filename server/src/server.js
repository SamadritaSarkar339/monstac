import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { setupPresence } from "./sockets/presence.socket.js";
import { setupWebRTC } from "./sockets/webrtc.socket.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.get("/", (req, res) => res.json({ ok: true, name: "MONSTAC API" }));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ai", aiRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  }
});

setupPresence(io);
setupWebRTC(io);

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);
httpServer.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));