import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { http } from "../api/http";

export default function RequestChatModal({ requestId, onClose }) {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!requestId) return;

    (async () => {
      const { data } = await http.get(`/api/request-chat/${requestId}`);
      setMessages(data.messages || []);
    })().catch(() => {});
  }, [requestId]);

  useEffect(() => {
    if (!socket || !requestId) return;

    const channel = `req:${requestId}`;
    socket.emit("chat:join", { channel });

    const onNew = ({ channel: ch, message }) => {
      if (ch !== channel) return;
      setMessages((m) => [...m, message]);
    };

    socket.on("chat:new", onNew);
    return () => socket.off("chat:new", onNew);
  }, [socket, requestId]);

  function send() {
    if (!text.trim()) return;
    socket?.emit("chat:request", {
      requestId,
      fromUserId: user.id,
      text
    });
    setText("");
  }

  if (!requestId) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Request Chat</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div style={box}>
          {messages.map((m) => (
            <div key={m._id || Math.random()} style={{ marginBottom: 8 }}>
              <b>{m.from?.name || "User"}:</b> {m.text}
            </div>
          ))}
          {!messages.length && <p className="muted">No messages yet. Ask before accepting.</p>}
        </div>

        <div className="row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
          />
          <button className="btn" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16, zIndex: 9999
};

const modal = {
  width: "min(650px, 100%)",
  background: "var(--card)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
  color: "var(--text)"
};

const box = {
  marginTop: 10,
  height: 260,
  overflow: "auto",
  background: "var(--panel)",
  borderRadius: 12,
  padding: 10,
  border: "1px solid rgba(255,255,255,0.10)"
};