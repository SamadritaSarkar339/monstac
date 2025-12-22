import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import ConnectionRequest from "../models/ConnectionRequest.js";

// helper
function otherParticipant(conv, meId) {
  return conv.participants.find((p) => p.toString() !== meId);
}

export function setupChat(io) {
  io.on("connection", (socket) => {
    // join any channel
    socket.on("chat:join", ({ channel }) => {
      if (!channel || typeof channel !== "string") return;
      socket.join(channel);
    });

    socket.on("chat:leave", ({ channel }) => {
      if (!channel || typeof channel !== "string") return;
      socket.leave(channel);
    });

    // ------------------------
    // OFFICE CHAT
    // ------------------------
    socket.on("chat:office", async ({ fromUserId, text }) => {
      try {
        if (!fromUserId || !text?.trim()) return;

        const msg = await Message.create({ kind: "office", from: fromUserId, type: "text", text: text.trim() });
        const populated = await msg.populate("from", "name avatar status");
        io.to("office").emit("chat:new", { channel: "office", message: populated });
      } catch {}
    });

    // ------------------------
    // ROOM CHAT
    // ------------------------
    socket.on("chat:room", async ({ roomId, fromUserId, text }) => {
      try {
        if (!roomId || !fromUserId || !text?.trim()) return;

        const msg = await Message.create({ kind: "room", roomId, from: fromUserId, type: "text", text: text.trim() });
        const populated = await msg.populate("from", "name avatar status");

        const channel = `room:${roomId}`;
        io.to(channel).emit("chat:new", { channel, message: populated });
      } catch {}
    });

    // ------------------------
    // REQUEST CHAT (pre-accept)
    // ------------------------
    socket.on("chat:request", async ({ requestId, fromUserId, text }) => {
      try {
        if (!requestId || !fromUserId || !text?.trim()) return;

        const req = await ConnectionRequest.findById(requestId).select("from to status");
        if (!req) return;

        const uid = String(fromUserId);
        const allowed = String(req.from) === uid || String(req.to) === uid;
        if (!allowed) return;

        const msg = await Message.create({
          kind: "request",
          requestId,
          from: fromUserId,
          type: "text",
          text: text.trim()
        });

        const populated = await msg.populate("from", "name avatar status");
        const channel = `req:${requestId}`;
        io.to(channel).emit("chat:new", { channel, message: populated });
      } catch {}
    });

    // ------------------------
    // WHATSAPP-LIKE DM
    // ------------------------

    // typing indicator
    socket.on("dm:typing", ({ conversationId, fromUserId, isTyping }) => {
      if (!conversationId || !fromUserId) return;
      const channel = `dm:${conversationId}`;
      socket.to(channel).emit("dm:typing", { conversationId, fromUserId, isTyping: !!isTyping });
    });

    // send message
    socket.on("dm:send", async ({ conversationId, fromUserId, text }) => {
      try {
        if (!conversationId || !fromUserId || !text?.trim()) return;

        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const allowed = conv.participants.some((p) => p.toString() === fromUserId);
        if (!allowed) return;

        const toUserId = otherParticipant(conv, fromUserId)?.toString();
        if (!toUserId) return;

        // ensure connected (extra safety)
        const me = await User.findById(fromUserId).select("connections");
        const isConnected = me?.connections?.some((id) => id.toString() === toUserId);
        if (!isConnected) return;

        const msg = await Message.create({
          kind: "dm",
          conversationId,
          from: fromUserId,
          to: toUserId,
          type: "text",
          text: text.trim(),
          status: "sent"
        });

        const populated = await msg.populate("from", "name avatar status");

        // update conversation metadata
        const unreadMap = conv.unread || new Map();
        const currentUnread = unreadMap.get(toUserId) || 0;
        unreadMap.set(toUserId, currentUnread + 1);
        unreadMap.set(fromUserId, unreadMap.get(fromUserId) || 0);

        conv.unread = unreadMap;
        conv.lastMessageText = msg.text;
        conv.lastMessageAt = msg.createdAt;
        conv.lastMessageFrom = fromUserId;
        await conv.save();

        const channel = `dm:${conversationId}`;
        io.to(channel).emit("dm:new", { conversationId, message: populated });

        // try mark delivered if receiver is in channel (simple heuristic)
        // client should emit dm:delivered when it receives dm:new
      } catch {}
    });

    // delivery tick (receiver notifies server it received message)
    socket.on("dm:delivered", async ({ messageId, conversationId, toUserId }) => {
      try {
        if (!messageId || !conversationId || !toUserId) return;

        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (msg.status === "read") return;

        msg.status = "delivered";
        await msg.save();

        io.to(`dm:${conversationId}`).emit("dm:status", { messageId, status: "delivered" });
      } catch {}
    });

    // read tick (when receiver opens chat and reads)
    socket.on("dm:read", async ({ conversationId, readerUserId }) => {
      try {
        if (!conversationId || !readerUserId) return;

        // set all delivered/sent messages addressed to reader as read
        await Message.updateMany(
          { kind: "dm", conversationId, to: readerUserId, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );

        // reset unread counter for reader
        const conv = await Conversation.findById(conversationId);
        if (conv) {
          const unreadMap = conv.unread || new Map();
          unreadMap.set(readerUserId, 0);
          conv.unread = unreadMap;
          await conv.save();
        }

        io.to(`dm:${conversationId}`).emit("dm:read", { conversationId, readerUserId });
      } catch {}
    });
  });
}