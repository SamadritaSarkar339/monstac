// WebRTC signaling (1-to-1) per roomId
// We do NOT send media via server — only signaling messages.

const roomPeers = new Map(); // roomId -> Set(socketId)

function peersInRoom(roomId) {
  if (!roomPeers.has(roomId)) roomPeers.set(roomId, new Set());
  return roomPeers.get(roomId);
}

export function setupWebRTC(io) {
  io.on("connection", (socket) => {
    socket.on("webrtc:join", ({ roomId }) => {
      if (!roomId) return;

      socket.join(roomId);

      const peers = peersInRoom(roomId);
      peers.add(socket.id);

      // If there are 2 peers, tell both they can start negotiation
      if (peers.size === 2) {
        io.to(roomId).emit("webrtc:ready", { roomId });
      } else if (peers.size > 2) {
        // MVP: only 1-to-1. Extra users should be blocked or asked to create another call.
        socket.emit("webrtc:full", { message: "Call is full (1-to-1 only in MVP)." });
      }
    });

    socket.on("webrtc:offer", ({ roomId, offer }) => {
      if (!roomId || !offer) return;
      socket.to(roomId).emit("webrtc:offer", { offer });
    });

    socket.on("webrtc:answer", ({ roomId, answer }) => {
      if (!roomId || !answer) return;
      socket.to(roomId).emit("webrtc:answer", { answer });
    });

    socket.on("webrtc:ice", ({ roomId, candidate }) => {
      if (!roomId || !candidate) return;
      socket.to(roomId).emit("webrtc:ice", { candidate });
    });

    socket.on("webrtc:leave", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);

      const peers = peersInRoom(roomId);
      peers.delete(socket.id);

      socket.to(roomId).emit("webrtc:peer-left", {});
    });

    socket.on("disconnect", () => {
      // remove socket from all rooms tracked
      for (const [roomId, set] of roomPeers.entries()) {
        if (set.has(socket.id)) {
          set.delete(socket.id);
          io.to(roomId).emit("webrtc:peer-left", {});
          if (set.size === 0) roomPeers.delete(roomId);
        }
      }
    });
  });
}