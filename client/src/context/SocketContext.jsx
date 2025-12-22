import React, { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export function SocketProvider({ user, children }) {
  const [socket, setSocket] = useState(null);
  const [presence, setPresence] = useState([]);

  useEffect(() => {
    if (!user) return;

    const s = io(import.meta.env.VITE_API_BASE || "http://localhost:5000", {
      transports: ["websocket"]
    });

    s.on("connect", () => {
      s.emit("presence:join", {
        userId: user.id,
        name: user.name,
        status: user.status,
        mood: user.avatar?.mood || "neutral"
      });
    });

    s.on("presence:list", (list) => setPresence(list || []));

    setSocket(s);
    return () => s.disconnect();
  }, [user?.id]);

  const value = useMemo(() => ({ socket, presence }), [socket, presence]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
