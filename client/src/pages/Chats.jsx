import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { http } from "../api/http";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export default function Chats() {
  const nav = useNavigate();

  const [convs, setConvs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const [c1, c2] = await Promise.all([
      http.get("/api/conversations"),
      http.get("/api/conversations/dm-contacts")
    ]);

    setConvs(c1.data.conversations || []);
    setContacts(c2.data.contacts || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e?.response?.data?.message || "Failed to load chats"));
  }, []);

  async function openDM(personId) {
    setErr("");
    try {
      const { data } = await http.post(`/api/conversations/dm/${personId}`);
      const convId = data.conversation?._id || data.conversation?.id;
      if (!convId) return setErr("Conversation not created.");
      nav(`/dm/${convId}`);
    } catch (e) {
      setErr(e?.response?.data?.message || "DM failed");
    }
  }

  return (
    <div className="page">
      <Navbar />

      <div className="card">
        <h2>Chats</h2>
        {err && <div className="err">{err}</div>}

        <h3 style={{ marginTop: 10 }}>Recent</h3>
        <div className="presenceList">
          {convs.map((c) => (
            <Link key={c._id} to={`/dm/${c._id}`} style={{ textDecoration: "none" }}>
              <div className="presenceRow" style={{ cursor: "pointer" }}>
                <div className="avatarCircle" style={{ background: c.otherUser?.avatar?.color || "#3b82f6" }} />
                <div className="presenceInfo">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{c.otherUser?.name}</b>
                    <span className="muted">
                      {c.lastMessageAt ? dayjs(c.lastMessageAt).format("hh:mm A") : ""}
                    </span>
                  </div>
                  <div className="muted" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span>{c.otherUser?.avatar?.emojiStatus || "💼"} {c.lastMessageText || "Say hi 👋"}</span>
                    {c.unreadCount > 0 && <span className="pill">{c.unreadCount}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!convs.length && <p className="muted">No recent chats yet.</p>}
        </div>

        <h3 style={{ marginTop: 18 }}>DM your connections</h3>
        <div className="presenceList">
          {contacts.map((u) => (
            <div className="presenceRow" key={u._id}>
              <div className="avatarCircle" style={{ background: u.avatar?.color || "#3b82f6" }} />
              <div className="presenceInfo">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <b>{u.name}</b>
                  <span className="pill">{u.avatar?.emojiStatus || "💼"}</span>
                  <span className="pill">{u.status || "available"}</span>
                </div>
                <div className="muted">
                  mood: {u.avatar?.mood || "neutral"} • avatar: {u.avatar?.avatarId || "av-1"}
                </div>
              </div>
              <button className="btn" onClick={() => openDM(u._id)}>DM</button>
            </div>
          ))}

          {!contacts.length && <p className="muted">No accepted connections yet.</p>}
        </div>
      </div>
    </div>
  );
}