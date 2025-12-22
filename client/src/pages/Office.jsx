import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { SocketContext } from "../context/SocketContext.jsx";
import { http } from "../api/http";
import Navbar from "../components/Navbar.jsx";
import AvatarCard from "../components/AvatarCard.jsx";
import PresencePanel from "../components/PresencePanel.jsx";
import RoomCard from "../components/RoomCard.jsx";
import "../styles/office.css";

export default function Office() {
  const { user } = useContext(AuthContext);
  const { presence } = useContext(SocketContext);

  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");

  async function loadRooms() {
    const { data } = await http.get("/api/rooms");
    setRooms(data.rooms || []);
  }

  useEffect(() => {
    loadRooms().catch(() => {});
  }, []);

  async function createRoom() {
    setErr("");
    try {
      const { data } = await http.post("/api/rooms", { name: newRoomName });
      setNewRoomName("");
      setRooms((r) => [data.room, ...r]);
    } catch (e) {
      setErr(e?.response?.data?.message || "Create room failed");
    }
  }

  async function joinRoom() {
    setErr("");
    try {
      const { data } = await http.post("/api/rooms/join", { code: joinCode });
      setJoinCode("");
      setRooms((r) => {
        const exists = r.some((x) => x._id === data.room._id);
        return exists ? r : [data.room, ...r];
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Join failed");
    }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="officeGrid">
        <div className="left">
          <AvatarCard />
          <div className="card">
            <h3>Rooms</h3>
            <div className="row">
              <input
                placeholder="New room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <button className="btn" onClick={createRoom} disabled={!newRoomName.trim()}>
                Create
              </button>
            </div>

            <div className="row">
              <input
                placeholder="Join code (e.g., A1B2C3)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button className="btn" onClick={joinRoom} disabled={!joinCode.trim()}>
                Join
              </button>
            </div>

            {err && <div className="err">{err}</div>}

            <div className="roomList">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
              {!rooms.length && <p className="muted">No rooms yet. Create or join one.</p>}
            </div>
          </div>
        </div>

        <div className="right">
          <PresencePanel presence={presence} myId={user?.id} />
          <div className="card">
            <h3>Office Vibes (MVP)</h3>
            <ul className="bullets">
              <li>Presence updates in real-time</li>
              <li>Status-driven “do not disturb” culture</li>
              <li>Rooms are your “zones” (coffee/brainstorm/standup)</li>
              <li>AI notes inside each room</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
