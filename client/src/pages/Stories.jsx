import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { http } from "../api/http";
import dayjs from "dayjs";

export default function Stories() {
  const [groups, setGroups] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [viewer, setViewer] = useState(null); // { user, stories, index }

  async function load() {
    const { data } = await http.get("/api/stories/feed");
    setGroups(data.groups || []);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function postText() {
    setErr("");
    try {
      await http.post("/api/stories/text", { text });
      setText("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed");
    }
  }

  async function postImage(file) {
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      await http.post("/api/stories/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed");
    }
  }

  function openGroup(g) {
    setViewer({ user: g.user, stories: g.stories, index: 0 });
  }

  function next() {
    setViewer((v) => {
      if (!v) return v;
      const ni = v.index + 1;
      if (ni >= v.stories.length) return null;
      return { ...v, index: ni };
    });
  }

  return (
    <div className="page">
      <Navbar />

      <div className="card">
        <h2>Status / Stories (24h)</h2>
        {err && <div className="err">{err}</div>}

        <label>Text status</label>
        <div className="row">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What's your office vibe today?" />
          <button className="btn" onClick={postText} disabled={!text.trim()}>Post</button>
        </div>

        <label style={{ marginTop: 10 }}>Image status</label>
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && postImage(e.target.files[0])} />
        <p className="muted">Stories expire automatically in 24 hours.</p>
      </div>

      <div className="card">
        <h3>Story Feed</h3>
        <div className="presenceList">
          {groups.map((g) => (
            <div className="presenceRow" key={g.user._id} style={{ cursor: "pointer" }} onClick={() => openGroup(g)}>
              <div className="avatarCircle" style={{ background: g.user?.avatar?.color || "#3b82f6", outline: "3px solid rgba(34,197,94,0.45)" }} />
              <div className="presenceInfo">
                <div><b>{g.user?.name}</b> <span className="pill">{g.user?.avatar?.emojiStatus || "💼"}</span></div>
                <div className="muted">{g.stories.length} story • last {dayjs(g.stories[0]?.createdAt).fromNow?.() || ""}</div>
              </div>
            </div>
          ))}
          {!groups.length && <p className="muted">No stories yet.</p>}
        </div>
      </div>

      {viewer && (
        <div style={overlay} onClick={() => setViewer(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <b>{viewer.user?.name}</b> <span className="pill">{viewer.user?.avatar?.emojiStatus || "💼"}</span>
                <div className="muted">{viewer.index + 1}/{viewer.stories.length}</div>
              </div>
              <button className="btn" onClick={() => setViewer(null)}>Close</button>
            </div>

            <div style={viewerBox}>
              {viewer.stories[viewer.index].type === "text" ? (
                <div style={{ fontSize: 22, lineHeight: 1.4 }}>
                  {viewer.stories[viewer.index].text}
                </div>
              ) : (
                <img
                  alt="story"
                  src={`${import.meta.env.VITE_API_BASE}${viewer.stories[viewer.index].mediaUrl}`}
                  style={{ width: "100%", borderRadius: 12 }}
                />
              )}
            </div>

            <div className="row">
              <button className="btn" onClick={next}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 9999
};
const modal = {
  width: "min(720px, 100%)",
  background: "var(--card)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
  color: "var(--text)"
};
const viewerBox = {
  marginTop: 10,
  background: "var(--panel)",
  borderRadius: 12,
  padding: 14,
  border: "1px solid rgba(255,255,255,0.10)"
};