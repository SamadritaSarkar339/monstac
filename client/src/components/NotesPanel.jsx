import React, { useEffect, useState } from "react";
import { http } from "../api/http";

export default function NotesPanel({ roomId }) {
  const [notes, setNotes] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiOut, setAiOut] = useState(null);
  const [err, setErr] = useState("");

  async function loadNotes() {
    const { data } = await http.get(`/api/rooms/${roomId}/notes`);
    setNotes(data.notes || []);
  }

  useEffect(() => {
    loadNotes().catch(() => {});
  }, [roomId]);

  async function summarize() {
    setErr("");
    setLoading(true);
    setAiOut(null);

    try {
      const { data } = await http.post("/api/ai/summarize", { transcript });
      setAiOut(data);
    } catch (e) {
      setErr(e?.response?.data?.message || "AI summarize failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!aiOut) return;
    const payload = {
      title: "AI Meeting Notes",
      transcript,
      summary: aiOut.summary,
      actionItems: aiOut.actionItems || []
    };

    const { data } = await http.post(`/api/rooms/${roomId}/notes`, payload);
    setNotes((n) => [data.note, ...n]);
    setTranscript("");
    setAiOut(null);
  }

  return (
    <div className="card">
      <h3>AI Meeting Notes</h3>
      <p className="muted">
        Paste meeting transcript / key points (for MVP). Later: live captions → auto notes.
      </p>

      <textarea
        rows={8}
        placeholder="Paste transcript or notes here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      {err && <div className="err">{err}</div>}

      <div className="row">
        <button className="btn" onClick={summarize} disabled={loading || transcript.trim().length < 10}>
          {loading ? "Summarizing..." : "Generate Summary"}
        </button>
        <button className="btn" onClick={saveNote} disabled={!aiOut}>
          Save Notes
        </button>
      </div>

      {aiOut && (
        <div className="noteOut">
          <h4>Summary</h4>
          <pre className="pre">{aiOut.summary}</pre>
          <h4>Action Items</h4>
          <ul>
            {(aiOut.actionItems || []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <hr />

      <h4>Recent Notes</h4>
      <div className="notesList">
        {notes.map((n) => (
          <div className="noteCard" key={n._id}>
            <div className="noteTitle"><b>{n.title}</b> <span className="muted">{new Date(n.createdAt).toLocaleString()}</span></div>
            <div className="muted">Summary:</div>
            <div className="noteText">{n.summary?.slice(0, 350)}{n.summary?.length > 350 ? "..." : ""}</div>
          </div>
        ))}
        {!notes.length && <p className="muted">No notes saved yet.</p>}
      </div>
    </div>
  );
}
