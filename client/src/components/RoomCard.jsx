import React from "react";
import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  return (
    <div className="roomCard">
      <div>
        <div className="roomTitle">{room.name}</div>
        <div className="muted">Join code: <b>{room.code}</b></div>
      </div>
      <Link className="btn" to={`/room/${room._id}`}>Enter</Link>
    </div>
  );
}
