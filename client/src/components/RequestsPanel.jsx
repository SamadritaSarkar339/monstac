import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import RequestChatModal from "./RequestChatModal.jsx";

export default function RequestsPanel({ onChanged }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [err, setErr] = useState("");
  const [chatReqId, setChatReqId] = useState(null);

  async function load() {
    const { data } = await http.get("/api/connections/requests");
    setIncoming(data.incoming || []);
    setOutgoing(data.outgoing || []);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function accept(requestId) {
    setErr("");
    try {
      await http.post("/api/connections/accept", { requestId });
      await load();
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Accept failed");
    }
  }

  async function reject(requestId) {
    setErr("");
    try {
      await http.post("/api/connections/reject", { requestId });
      await load();
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  }

  return (
    <div className="card">
      <h3>Connection Requests</h3>
      {err && <div className="err">{err}</div>}

      <h4 className="muted" style={{ marginTop: 10 }}>Incoming</h4>
      <div className="presenceList">
        {incoming.map((r) => (
          <div className="presenceRow" key={r._id}>
            <div className="presenceInfo">
              <div><b>{r.from?.name}</b></div>
              <div className="muted">{r.from?.email}</div>
            </div>

            <button className="btn" onClick={() => setChatReqId(r._id)}>
              Chat
            </button>
            <button className="btn" onClick={() => accept(r._id)}>
              Accept
            </button>
            <button className="btn" onClick={() => reject(r._id)}>
              Reject
            </button>
          </div>
        ))}
        {!incoming.length && <p className="muted">No incoming requests.</p>}
      </div>

      <h4 className="muted" style={{ marginTop: 14 }}>Outgoing</h4>
      <div className="presenceList">
        {outgoing.map((r) => (
          <div className="presenceRow" key={r._id}>
            <div className="presenceInfo">
              <div><b>{r.to?.name}</b></div>
              <div className="muted">Pending</div>
            </div>

            <button className="btn" onClick={() => setChatReqId(r._id)}>
              Chat
            </button>
          </div>
        ))}
        {!outgoing.length && <p className="muted">No outgoing requests.</p>}
      </div>

      {chatReqId && (
        <RequestChatModal
          requestId={chatReqId}
          onClose={() => setChatReqId(null)}
        />
      )}
    </div>
  );
}