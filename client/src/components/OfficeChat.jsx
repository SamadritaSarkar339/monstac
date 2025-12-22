import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { http } from "../api/http";

export default function OfficeChat() {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await http.get("/api/chat/office");
      setMessages(data.messages || []);
    })().catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("chat:join", { channel: "office" });
    const onNew = ({ channel, message }) => {
      if (channel !== "office") return;
      setMessages((m) => [...m, message]);
    };
    socket.on("chat:new", onNew);
    return () => socket.off("chat:new", onNew);
  }, [socket]);

  function send() {
    if (!text.trim()) return;
    socket?.emit("chat:office", { fromUserId: user.id, text });
    setText("");
  }

  return (
    <div className="card">
      <h3>Office Chat</h3>
      <div style={{ maxHeight: 240, overflow: "auto", background: "var(--panel)", borderRadius: 12, padding: 10, border: "1px solid rgba(255,255,255,0.10)" }}>
        {messages.map((m) => (
          <div key={m._id || Math.random()} style={{ marginBottom: 8 }}>
            <b>{m.from?.name || "User"}:</b> <span>{m.text}</span>
          </div>
        ))}
        {!messages.length && <p className="muted">No messages yet.</p>}
      </div>

      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  );
}