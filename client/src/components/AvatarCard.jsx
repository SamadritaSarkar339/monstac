import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { SocketContext } from "../context/SocketContext.jsx";

export default function AvatarCard() {
  const { user, updateMe } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [status, setStatus] = useState(user?.status || "available");
  const [mood, setMood] = useState(user?.avatar?.mood || "neutral");

  useEffect(() => {
    setStatus(user?.status || "available");
    setMood(user?.avatar?.mood || "neutral");
  }, [user?.status, user?.avatar?.mood]);

  async function save() {
    await updateMe({ status, avatar: { mood } });
    socket?.emit("presence:update", { status, mood });
  }

  return (
    <div className="card">
      <h3>Your Avatar Presence</h3>
      <div className="avatarPreview" style={{ borderColor: user?.avatar?.color || "#3b82f6" }}>
        <div className="avatarCircle" style={{ background: user?.avatar?.color || "#3b82f6" }} />
        <div>
          <div><b>{user?.name}</b></div>
          <div className="muted">Role-based avatar (extend later)</div>
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
          <label>Mood</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="neutral">neutral</option>
            <option value="happy">happy</option>
            <option value="tired">tired</option>
            <option value="focused">focused</option>
          </select>
        </div>
      </div>

      <button className="btn" onClick={save}>Update Presence</button>
      <p className="muted">
        This drives the “Smart Interruptions” culture: focus/busy reduces noise.
      </p>
    </div>
  );
}
