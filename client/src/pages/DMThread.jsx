import React, { useContext, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useParams } from "react-router-dom";
import { http } from "../api/http";
import { SocketContext } from "../context/SocketContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import dayjs from "dayjs";

function Tick({ status }) {
  if (status === "read") return <span title="Read">✅✅</span>;
  if (status === "delivered") return <span title="Delivered">✓✓</span>;
  return <span title="Sent">✓</span>;
}

export default function DMThread() {
  const { conversationId } = useParams();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const listRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { data } = await http.get(`/api/messages/dm/${conversationId}`);
      setMessages(data.messages || []);
    })().catch(() => {});
  }, [conversationId]);

  // join channel + listeners
  useEffect(() => {
    if (!socket) return;
    const channel = `dm:${conversationId}`;
    socket.emit("chat:join", { channel });

    // Mark read when opened
    socket.emit("dm:read", { conversationId, readerUserId: user.id });

    const onNew = async ({ conversationId: cid, message }) => {
      if (cid !== conversationId) return;
      setMessages((m) => [...m, message]);

      // receiver tells delivered
      if (message?.from?._id !== user.id) {
        socket.emit("dm:delivered", { messageId: message._id, conversationId, toUserId: user.id });
      }
    };

    const onStatus = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      );
    };

    const onRead = ({ conversationId: cid, readerUserId }) => {
      if (cid !== conversationId) return;
      // when someone reads, messages to them become read
      setMessages((prev) =>
        prev.map((m) => (m.to === readerUserId ? { ...m, status: "read" } : m))
      );
    };

    const onTyping = ({ conversationId: cid, fromUserId, isTyping }) => {
      if (cid !== conversationId) return;
      if (fromUserId === user.id) return;
      setTyping(!!isTyping);
    };

    socket.on("dm:new", onNew);
    socket.on("dm:status", onStatus);
    socket.on("dm:read", onRead);
    socket.on("dm:typing", onTyping);

    return () => {
      socket.emit("chat:leave", { channel });
      socket.off("dm:new", onNew);
      socket.off("dm:status", onStatus);
      socket.off("dm:read", onRead);
      socket.off("dm:typing", onTyping);
    };
  }, [socket, conversationId, user.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function send() {
    if (!text.trim()) return;
    socket?.emit("dm:send", { conversationId, fromUserId: user.id, text });
    setText("");
    socket?.emit("dm:typing", { conversationId, fromUserId: user.id, isTyping: false });
  }

  function handleTyping(v) {
    setText(v);
    socket?.emit("dm:typing", { conversationId, fromUserId: user.id, isTyping: true });

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("dm:typing", { conversationId, fromUserId: user.id, isTyping: false });
    }, 800);
  }

  return (
    <div className="page">
      <Navbar />

      <div className="card">
        <h2>Direct Message</h2>
        {typing && <p className="muted">Typing…</p>}

        <div ref={listRef} style={{ height: 420, overflow: "auto", background: "var(--panel)", borderRadius: 12, padding: 10, border: "1px solid rgba(255,255,255,0.10)" }}>
          {messages.map((m) => {
            const mine = (m.from?._id || m.from) === user.id;
            const color = m.from?.avatar?.color || "#3b82f6";
            return (
              <div key={m._id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
                {!mine && <div style={{ width: 28, height: 28, borderRadius: 999, background: color, marginRight: 8 }} />}
                <div style={{
                  maxWidth: "70%",
                  background: mine ? "var(--accent-soft)" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: 10,
                  borderRadius: 12
                }}>
                  {!mine && (
                    <div className="muted" style={{ marginBottom: 4 }}>
                      <b style={{ color: "#e5e7eb" }}>{m.from?.name}</b> {m.from?.avatar?.emojiStatus || "💼"}
                    </div>
                  )}
                  <div>{m.text}</div>
                  <div className="muted" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span>{dayjs(m.createdAt).format("hh:mm A")}</span>
                    {mine && <Tick status={m.status} />}
                  </div>
                </div>
              </div>
            );
          })}
          {!messages.length && <p className="muted">No messages yet.</p>}
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input value={text} onChange={(e) => handleTyping(e.target.value)} placeholder="Message…" />
          <button className="btn" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}