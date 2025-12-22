import React, { useContext, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { SocketContext } from "../context/SocketContext.jsx";

const AVATARS = ["av-1","av-2","av-3","av-4","av-5","av-6","av-7","av-8"];
const OUTFITS = ["outfit-1","outfit-2","outfit-3","outfit-4","outfit-5"];
const MOODS = ["neutral","happy","focused","tired"];
const EMOJIS = ["💼","🧠","☕","🔥","📞","🧘","🎯","😴"];

function pickDifferent(list, current) {
  const options = list.filter((x) => x !== current);
  return options[Math.floor(Math.random() * options.length)];
}

export default function AvatarStudio() {
  const { user, updateMe } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [avatarId, setAvatarId] = useState(user?.avatar?.avatarId || "av-1");
  const [outfitId, setOutfitId] = useState(user?.avatar?.outfitId || "outfit-1");
  const [mood, setMood] = useState(user?.avatar?.mood || "neutral");
  const [color, setColor] = useState(user?.avatar?.color || "#3b82f6");
  const [emojiStatus, setEmojiStatus] = useState(user?.avatar?.emojiStatus || "💼");
  const [savedMsg, setSavedMsg] = useState("");

  const label = useMemo(() => `${avatarId} • ${outfitId}`, [avatarId, outfitId]);

  useEffect(() => {
    document.body.setAttribute("data-mood", mood);
  }, [mood]);

  function shuffleAll() {
    setAvatarId((c) => pickDifferent(AVATARS, c));
    setOutfitId((c) => pickDifferent(OUTFITS, c));
    setMood((c) => pickDifferent(MOODS, c));
    setEmojiStatus((c) => pickDifferent(EMOJIS, c));
  }

  async function save() {
    setSavedMsg("");
    await updateMe({ avatar: { avatarId, outfitId, mood, color, emojiStatus } });
    socket?.emit("presence:update", { status: user?.status || "available", mood });
    setSavedMsg("Saved ✅");
    setTimeout(() => setSavedMsg(""), 1200);
  }

  return (
    <div className="page">
      <Navbar />
      <div className="card">
        <h2>Avatar Studio (Snapchat vibe)</h2>

        <div className="row" style={{ alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: color, border: "2px solid rgba(255,255,255,0.2)" }} />
          <div>
            <div><b>{user?.name}</b> <span className="pill">{emojiStatus}</span></div>
            <div className="muted">{label} • Mood theme: {mood}</div>
          </div>
        </div>

        <div className="row">
          <div className="col">
            <label>Avatar</label>
            <select value={avatarId} onChange={(e) => setAvatarId(e.target.value)}>
              {AVATARS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Outfit</label>
            <select value={outfitId} onChange={(e) => setOutfitId(e.target.value)}>
              {OUTFITS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col">
            <label>Mood (changes theme)</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)}>
              {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Avatar color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="col">
            <label>Emoji Status</label>
            <select value={emojiStatus} onChange={(e) => setEmojiStatus(e.target.value)}>
              {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Quick actions</label>
            <div className="row">
              <button className="btn" onClick={shuffleAll}>Shuffle</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>

        {savedMsg && <p className="muted">{savedMsg}</p>}
      </div>
    </div>
  );
}