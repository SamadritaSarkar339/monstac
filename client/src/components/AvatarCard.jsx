import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { SocketContext } from "../context/SocketContext.jsx";

const AVATARS = [
  { id: "av-1", name: "Classic" },
  { id: "av-2", name: "Neo" },
  { id: "av-3", name: "Minimal" },
  { id: "av-4", name: "Pixel" },
  { id: "av-5", name: "Cyber" }
];

function randomAvatarId(curr) {
  const ids = AVATARS.map((a) => a.id).filter((id) => id !== curr);
  return ids[Math.floor(Math.random() * ids.length)];
}

export default function AvatarCard() {
  const { user, updateMe } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [status, setStatus] = useState(user?.status || "available");
  const [mood, setMood] = useState(user?.avatar?.mood || "neutral");
  const [avatarId, setAvatarId] = useState(user?.avatar?.avatarId || "av-1");
  const [color, setColor] = useState(user?.avatar?.color || "#3b82f6");

  const avatarLabel = useMemo(() => {
    return AVATARS.find((a) => a.id === avatarId)?.name || "Custom";
  }, [avatarId]);

  useEffect(() => {
    setStatus(user?.status || "available");
    setMood(user?.avatar?.mood || "neutral");
    setAvatarId(user?.avatar?.avatarId || "av-1");
    setColor(user?.avatar?.color || "#3b82f6");
  }, [user?.status, user?.avatar]);

  // Apply mood theme globally
  useEffect(() => {
    document.body.setAttribute("data-mood", mood || "neutral");
  }, [mood]);

  async function save() {
    await updateMe({ status, avatar: { mood, avatarId, color } });
    socket?.emit("presence:update", { status, mood });
  }

  function shuffle() {
    setAvatarId((curr) => randomAvatarId(curr));
  }

  return (
    <div className="card">
      <h3>Your Avatar Presence</h3>

      <div className="avatarPreview" style={{ borderColor: color }}>
        <div className="avatarCircle" style={{ background: color }} />
        <div>
          <div><b>{user?.name}</b></div>
          <div className="muted">Avatar: <b>{avatarLabel}</b> • Mood theme enabled</div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="available">available</option>
            <option value="focus">focus</option>
            <option value="busy">busy</option>
            <option value="away">away</option>
          </select>
        </div>

        <div className="col">
          <label>Mood (changes theme)</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="neutral">neutral</option>
            <option value="happy">happy</option>
            <option value="tired">tired</option>
            <option value="focused">focused</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Avatar</label>
          <select value={avatarId} onChange={(e) => setAvatarId(e.target.value)}>
            {AVATARS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="col">
          <label>Avatar Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} type="color" />
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={shuffle}>Shuffle Avatar</button>
        <button className="btn" onClick={save}>Save</button>
      </div>

      <p className="muted">
        Mood changes the whole office theme. Status affects “do not disturb” culture.
      </p>
    </div>
  );
}