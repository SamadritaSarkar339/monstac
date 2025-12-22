import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import "../styles/Navbar.css";


export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  return (
    <div className="nav">
      {/* LEFT */}
      <div className="navLeft">
        <NavLink className="brand" to="/office">
          MONSTAC
        </NavLink>

        <span className="pill">Office Metaverse MVP</span>

        <NavLink
          to="/chats"
          className={({ isActive }) =>
            `navBtn ${isActive ? "navActive" : ""}`
          }
        >
          Chats
        </NavLink>

        <NavLink
          to="/stories"
          className={({ isActive }) =>
            `navBtn ${isActive ? "navActive" : ""}`
          }
        >
          Stories
        </NavLink>

        <NavLink
          to="/avatar"
          className={({ isActive }) =>
            `navBtn ${isActive ? "navActive" : ""}`
          }
        >
          Avatar
        </NavLink>
      </div>

      {/* RIGHT */}
      <div className="navRight">
        <div className="userBadge">
          <span className="statusDot dot-available" />
          <span className="userName">{user?.name}</span>
        </div>

        <button
          className="btnGhost logoutBtn"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
