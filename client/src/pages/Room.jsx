import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import NotesPanel from "../components/NotesPanel.jsx";
import { SocketContext } from "../context/SocketContext.jsx";
import { http } from "../api/http";
import "../styles/room.css";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" } // free STUN
  ]
};

export default function Room() {
  const { roomId } = useParams();
  const { socket } = useContext(SocketContext);

  const [room, setRoom] = useState(null);
  const [err, setErr] = useState("");
  const [callState, setCallState] = useState("idle"); // idle, ready, calling, connected

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const callRoomId = useMemo(() => `room-${roomId}`, [roomId]); // stable call “channel”

  useEffect(() => {
    (async () => {
      try {
        const roomsRes = await http.get("/api/rooms");
        const found = (roomsRes.data.rooms || []).find((r) => r._id === roomId);
        setRoom(found || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load room");
      }
    })();
  }, [roomId]);

  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("webrtc:ice", { roomId: callRoomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setCallState("connected");
      if (s === "disconnected" || s === "failed" || s === "closed") {
        // keep UI sane
      }
    };

    return pc;
  }

  async function ensureLocalMedia() {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startCallAsCaller() {
    setErr("");
    setCallState("calling");

    const stream = await ensureLocalMedia();

    const pc = createPeerConnection();
    pcRef.current = pc;

    // add tracks
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket?.emit("webrtc:offer", { roomId: callRoomId, offer });
  }

  async function handleOffer(offer) {
    setErr("");
    const stream = await ensureLocalMedia();

    const pc = createPeerConnection();
    pcRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket?.emit("webrtc:answer", { roomId: callRoomId, answer });
    setCallState("calling");
  }

  async function handleAnswer(answer) {
    const pc = pcRef.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async function handleIce(candidate) {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // ignore minor timing issues
    }
  }

  function cleanupCall() {
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.close();
      pcRef.current = null;
    }

    const ls = localStreamRef.current;
    if (ls) {
      ls.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setCallState("idle");
  }

  function leaveCall() {
    socket?.emit("webrtc:leave", { roomId: callRoomId });
    cleanupCall();
  }

  // socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("webrtc:join", { roomId: callRoomId });

    const onReady = async () => {
      // For MVP: both sides get ready.
      // Let “caller” be the one who clicks Start Call.
      setCallState("ready");
    };

    const onFull = (msg) => setErr(msg?.message || "Call is full");
    const onOffer = async ({ offer }) => handleOffer(offer);
    const onAnswer = async ({ answer }) => handleAnswer(answer);
    const onIce = async ({ candidate }) => handleIce(candidate);

    const onPeerLeft = () => {
      setErr("Peer left the call.");
      cleanupCall();
    };

    socket.on("webrtc:ready", onReady);
    socket.on("webrtc:full", onFull);
    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);
    socket.on("webrtc:peer-left", onPeerLeft);

    return () => {
      socket.off("webrtc:ready", onReady);
      socket.off("webrtc:full", onFull);
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);
      socket.off("webrtc:peer-left", onPeerLeft);

      socket.emit("webrtc:leave", { roomId: callRoomId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, callRoomId]);

  if (err) {
    // show but still allow page
  }

  return (
    <div className="page">
      <Navbar />

      <div className="roomHeader">
        <h2>{room?.name || "Room"}</h2>
        <div className="muted">Call Channel: {callRoomId}</div>
      </div>

      <div className="roomGrid">
        <div className="left">
          <div className="videoCard">
            <div className="videoTop">
              <h3>WebRTC Video Call (Free)</h3>
              <div className="muted">
                Status: <b>{callState}</b>
              </div>
            </div>

            {err && <div className="err">{err}</div>}

            <div className="videoGrid">
              <div className="videoBox">
                <div className="muted">You</div>
                <video ref={localVideoRef} autoPlay playsInline muted className="vid" />
              </div>
              <div className="videoBox">
                <div className="muted">Teammate</div>
                <video ref={remoteVideoRef} autoPlay playsInline className="vid" />
              </div>
            </div>

            <div className="row">
              <button className="btn" onClick={startCallAsCaller} disabled={callState === "calling" || callState === "connected"}>
                Start Call
              </button>
              <button className="btn" onClick={leaveCall} disabled={callState === "idle"}>
                Leave
              </button>
            </div>

            <p className="muted" style={{ marginTop: 10 }}>
              Tip: For best results, both users should open this same room page. Works on most networks with STUN.
            </p>
          </div>
        </div>

        <div className="right">
          <NotesPanel roomId={roomId} />
        </div>
      </div>
    </div>
  );
}