import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Office from "./pages/Office.jsx";
import Room from "./pages/Room.jsx";
import Chats from "./pages/Chats.jsx";
import DMThread from "./pages/DMThread.jsx";
import AvatarStudio from "./pages/AvatarStudio.jsx";
import Stories from "./pages/Stories.jsx";

// inside <Routes>


function Guard({ children }) {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, token } = useContext(AuthContext);

  return (
    <SocketProvider user={token ? user : null}>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/office" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={token ? <Navigate to="/office" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/office" replace /> : <Register />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/dm/:conversationId" element={<DMThread />} />
        <Route path="/avatar" element={<AvatarStudio />} />
        <Route path="/stories" element={<Stories />} />
        <Route
          path="/office"
          element={
            <Guard>
              <Office />
            </Guard>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <Guard>
              <Room />
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}
