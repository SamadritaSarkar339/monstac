import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Office from "./pages/Office.jsx";
import Room from "./pages/Room.jsx";

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
