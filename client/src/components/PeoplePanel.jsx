import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";

export default function PeoplePanel({ myId, onRequestSent }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    const [uRes, rRes] = await Promise.all([
      http.get("/api/users"),
      http.get("/api/connections/requests")
    ]);

    setUsers(uRes.data.users || []);
    setConnections(rRes.data.connections || []);
    setIncoming(rRes.data.incoming || []);
    setOutgoing(rRes.data.outgoing || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const connectionSet = useMemo(() => {
    const s = new Set();
    for (const u of connections) s.add(String(u._id));
    return s;
  }, [connections]);

  const incomingByFrom = useMemo(() => {
    const m = new Map();
    for (const r of incoming) {
      const fromId = String(r.from?._id || r.from);
      m.set(fromId, r);
    }
    return m;
  }, [incoming]);

  const outgoingSet = useMemo(() => {
    const s = new Set();
    for (const r of outgoing) s.add(String(r.to?._id || r.to));
    return s;
  }, [outgoing]);

  async function sendRequest(toUserId) {
    setErr("");
    try {
      await http.post("/api/connections/request", { toUserId });
      onRequestSent?.();
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Request failed");
    }
  }

  async function acceptRequest(requestId) {
    setErr("");
    try {
      await http.post("/api/connections/accept", { requestId });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Accept failed");
    }
  }

  async function rejectRequest(requestId) {
    setErr("");
    try {
      await http.post("/api/connections/reject", { requestId });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  }

  async function openDM(personId) {
    setErr("");
    try {
      const { data } = await http.post(`/api/conversations/dm/${personId}`);
      const convId = data.conversation?._id || data.conversation?.id;
      if (!convId) return setErr("Conversation not created. Are you connected?");
      navigate(`/dm/${convId}`);
    } catch (e) {
      setErr(e?.response?.data?.message || "DM failed");
    }
  }

  return (
    <div className="card">
      <h3>People in Organization</h3>
      {err && <div className="err">{err}</div>}

      <div className="presenceList">
        {users
          .filter((u) => String(u._id) !== String(myId))
          .map((u) => {
            const uid = String(u._id);
            const isConnected = connectionSet.has(uid);
            const incomingReq = incomingByFrom.get(uid);
            const hasOutgoing = outgoingSet.has(uid);

            const avatarColor = u.avatar?.color || "#3b82f6";
            const emoji = u.avatar?.emojiStatus || "💼";

            return (
              <div className="presenceRow" key={u._id}>
                <div className="avatarCircle" style={{ background: avatarColor }} />

                <div className="presenceInfo">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <b>{u.name}</b>
                    <span className="pill">{u.status || "available"}</span>
                    <span className="pill">{emoji}</span>
                  </div>
                  <div className="muted">
                    Mood: {u.avatar?.mood || "neutral"} • Avatar: {u.avatar?.avatarId || "av-1"} • Outfit:{" "}
                    {u.avatar?.outfitId || "outfit-1"}
                  </div>
                </div>

                {isConnected ? (
                  <button className="btn" onClick={() => openDM(u._id)}>DM</button>
                ) : incomingReq ? (
                  <>
                    <button className="btn" onClick={() => acceptRequest(incomingReq._id)}>Accept</button>
                    <button className="btn" onClick={() => rejectRequest(incomingReq._id)}>Reject</button>
                  </>
                ) : hasOutgoing ? (
                  <span className="muted">Requested</span>
                ) : (
                  <button className="btn" onClick={() => sendRequest(u._id)}>Connect</button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}