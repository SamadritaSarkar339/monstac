import React from "react";

export default function PresencePanel({ presence, myId }) {
  return (
    <div className="card">
      <h3>Who’s in the Office</h3>
      <div className="presenceList">
        {(presence || []).map((p, idx) => (
          <div className="presenceRow" key={idx}>
            <div className="dot" />
            <div className="presenceInfo">
              <div>
                <b>{p.name || p.userId}</b> {p.userId === myId ? <span className="pill">You</span> : null}
              </div>
              <div className="muted">Status: {p.status || "available"} • Mood: {p.mood || "neutral"}</div>
            </div>
          </div>
        ))}
        {!presence?.length && <p className="muted">No one online yet.</p>}
      </div>
    </div>
  );
}
