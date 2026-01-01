import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import Sidebar from "../../components/sidebar";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://eos-server.onrender.com";

const GuestMatchmaking: React.FC = () => {
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState("Connecting...");
  const [timeInQueue, setTimeInQueue] = useState(0);

  useEffect(() => {
    console.log("🔌 Creating socket connection...");
    const s = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });
    setSocket(s);

    // ✅ On connect, immediately emit joinGuestQueue
    s.on("connect", () => {
      console.log("✅ Connected:", s.id);
      setStatus("Searching for opponent...");
      s.emit("joinGuestQueue"); // ← THIS IS CRITICAL
    });

    s.on("queued", () => {
      console.log("⏳ Queued");
      setStatus("Waiting for opponent...");
      setTimeInQueue(0);
    });

    s.on("matchFound", (data) => {
      console.log("🎮 Match found:", data);
      if (!data?.matchId || !data?.yourRole) return;
      setStatus("Match found! Starting game...");

      const url = `/multiplayer?matchId=${data.matchId}&role=${data.yourRole}&guest=true`;
      setTimeout(() => {
        s.disconnect();
        navigate(url);
      }, 100);
    });

    s.on("error", (err) => {
      console.error("❌ Socket error:", err);
      setStatus("Error connecting to matchmaking");
    });

    s.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
    });

    const timer = setInterval(() => setTimeInQueue((t) => t + 1), 1000);

    return () => {
      clearInterval(timer);
      s.emit("leaveQueue");
      s.removeAllListeners();
      s.disconnect();
    };
  }, [navigate]);

  const handleCancel = () => {
    if (socket) {
      socket.emit("leaveQueue");
      socket.disconnect();
    }
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#262522] text-[#bababa]">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="bg-[#312e2b] p-10 rounded-xl text-center w-[420px]">
          <h1 className="text-3xl font-bold text-white mb-4">Finding Opponent</h1>
          <p className="text-gray-400 mb-2">{status}</p>
          <p className="text-xs text-gray-500">
            {timeInQueue < 5 ? `Minimum wait time: ${5 - timeInQueue}s` : "Ready to match"}
          </p>
          <div className="mt-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Cancel
            </button>
          </div>
          {socket && (
            <p className="mt-4 text-xs text-gray-600">
              Socket: {socket.connected ? "✅ Connected" : "❌ Disconnected"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default GuestMatchmaking;
