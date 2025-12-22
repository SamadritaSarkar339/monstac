import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  return (
    <div className="nav">
      <div className="navLeft">
        <Link className="brand" to="/office">MONSTAC</Link>
        <span className="pill">Office Metaverse MVP</span>
      </div>
      <div className="navRight">
        <span className="muted">{user?.name}</span>
        <button className="btn" onClick={() => { logout(); nav("/login"); }}>
          Logout
        </button>
      </div>
    </div>
  );
}
