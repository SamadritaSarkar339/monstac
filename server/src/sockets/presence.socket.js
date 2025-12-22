// server/src/sockets/presence.socket.js

/**
 * In-memory presence store
 * socket.id -> user presence data
 */
const onlineUsers = new Map();

/**
 * Setup real-time presence system
 * @param {import("socket.io").Server} io
 */
export function setupPresence(io) {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    /**
     * User joins office presence
     */
    socket.on("presence:join", (payload) => {
      if (!payload || !payload.userId) return;

      const presenceData = {
        socketId: socket.id,
        userId: payload.userId,
        name: payload.name || "Unknown",
        status: payload.status || "available",
        mood: payload.mood || "neutral",
        joinedAt: Date.now()
      };

      onlineUsers.set(socket.id, presenceData);

      // Broadcast updated presence list
      io.emit("presence:list", Array.from(onlineUsers.values()));
    });

    /**
     * Update presence (status/mood)
     */
    socket.on("presence:update", (payload) => {
      const existing = onlineUsers.get(socket.id);
      if (!existing) return;

      onlineUsers.set(socket.id, {
        ...existing,
        status: payload?.status ?? existing.status,
        mood: payload?.mood ?? existing.mood,
        updatedAt: Date.now()
      });

      io.emit("presence:list", Array.from(onlineUsers.values()));
    });

    /**
     * Handle disconnect
     */
    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("presence:list", Array.from(onlineUsers.values()));
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });
}
