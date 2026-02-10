import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import Sidebar from '../../components/sidebar';
import { getSocket } from '../../config/socket';

// No longer need module-level locks for singleton

const GuestMatchmaking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTime = parseInt(searchParams.get('time') || '600');

  const getModeLabel = (time: number) => {
    if (!gameModes.length) return `${time / 60}m Game`;
    const mode = gameModes.find((m: any) => m.duration_minutes === time / 60);
    return mode ? `${mode.title} (${mode.duration_minutes}m)` : `${time / 60}m Game`;
  };
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  const [isSearching, setIsSearching] = useState(false);
  const [timeInQueue, setTimeInQueue] = useState<number>(0);
  const [gameModes, setGameModes] = useState<any[]>([]);

  const socketInstanceRef = useRef<Socket | null>(null);
  const joinQueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch game modes
    const fetchGameModes = async () => {
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
        const response = await fetch(`${serverUrl}/api/gamemodes`);
        if (response.ok) {
          const data = await response.json();
          setGameModes(data);
        }
      } catch (err) {
        console.error("Error fetching game modes:", err);
      }
    };
    fetchGameModes();

    // Connect to socket server
    const newSocket = getSocket();
    if (!newSocket) return;

    socketInstanceRef.current = newSocket;
    setSocket(newSocket);

    // Socket event handlers - set these up BEFORE emitting joinGuestQueue
    const handleConnect = () => {
      console.log('✅ Connected to server:', newSocket.id);
      setStatus('Connected! Searching for opponent...');
      setIsSearching(true);

      // DELAYED JOIN: Show searching UI immediately, but wait 5s to emit joinQueue
      console.log('⏳ Starting 5s delay before joining guest queue...');
      joinQueueTimeoutRef.current = setTimeout(() => {
        console.log('📤 5s delay over. Emitting joinQueue with time:', selectedTime);
        newSocket.emit('joinQueue', { timeControl: selectedTime });
      }, 5000);
    };

    const handleQueued = (data: any) => {
      console.log('⏳ Queued event received:', data);
      setStatus('Waiting for opponent...');
      setTimeInQueue(0); // Reset timer when queued
    };

    const handleMatchFound = (data: any) => {
      console.log('🎮 Match found event received!', data);
      console.log('📋 Match data:', JSON.stringify(data, null, 2));
      console.log('🔍 Socket state:', {
        connected: newSocket.connected,
        id: newSocket.id,
        disconnected: newSocket.disconnected,
      });
      setStatus('Match found! Starting game...');

      // Navigate to multiplayer game with role and matchId
      if (data && data.yourRole && data.matchId) {
        // Store guest ID for multiplayer page to pick up
        if (data.yourUserId) {
          sessionStorage.setItem('guestUserId', data.yourUserId);
        }

        const gameUrl = `/multiplayer/${data.matchId}`;
        newSocket.removeAllListeners();
        newSocket.disconnect();

        // Small delay to ensure socket is disconnected before navigation
        setTimeout(() => {
          try {
            navigate(gameUrl, { replace: false });
            console.log('✅ Navigation called');
          } catch (error) {
            console.error('❌ Navigation error:', error);
            // Fallback: use window.location
            window.location.href = gameUrl;
          }
        }, 100);
      } else {
        console.error('❌ Invalid match data:', data);
        console.error('❌ Missing fields:', {
          hasData: !!data,
          hasYourRole: !!(data && data.yourRole),
          hasMatchId: !!(data && data.matchId),
        });
        setStatus('Error: Invalid match data received');
      }
    };

    const handleError = (data: any) => {
      console.error('❌ Socket error:', data);
      setStatus(`Error: ${data.message || 'Unknown error'}`);
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ Disconnected from server:', reason);
      setStatus('Disconnected');
      setIsSearching(false);
    };

    // Register all event handlers
    console.log('📝 Registering socket event handlers...');
    newSocket.on('connect', handleConnect);
    newSocket.on('queued', handleQueued);

    // Register matchFound handler with explicit logging
    newSocket.on('matchFound', (data: any) => {
      console.log('🔔 matchFound event triggered on socket!', data);
      handleMatchFound(data);
    });

    newSocket.on('error', handleError);
    newSocket.on('disconnect', handleDisconnect);

    // Debug: Log when any event is received
    const originalOnevent = (newSocket as any).onevent;
    if (originalOnevent) {
      (newSocket as any).onevent = function (packet: any) {
        console.log('📨 Socket received event:', packet[0], packet[1]);
        return originalOnevent.call(this, packet);
      };
    }

    // If already connected, trigger connect handler
    if (newSocket.connected) {
      console.log('✅ Socket already connected, triggering connect handler');
      handleConnect();
    } else {
      console.log('⏳ Waiting for socket connection...');
    }

    // Timer to track time in queue
    const queueTimer = setInterval(() => {
      setTimeInQueue(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(queueTimer);

      console.log('🧹 Cleaning up matchmaking component...');

      if (joinQueueTimeoutRef.current) clearTimeout(joinQueueTimeoutRef.current);

      // Properly clean up socket listeners
      const socketToCleanup = socketInstanceRef.current || newSocket;
      if (socketToCleanup) {
        console.log('🔌 Leaving queue and cleaning up listeners...');
        socketToCleanup.emit('leaveQueue');
        socketToCleanup.off('connect', handleConnect);
        socketToCleanup.off('queued', handleQueued);
        socketToCleanup.off('matchFound', handleMatchFound);
        socketToCleanup.off('error', handleError);
        socketToCleanup.off('disconnect', handleDisconnect);
      }

      // Clear component ref
      socketInstanceRef.current = null;
    };

  }, [navigate]);

  const handleCancel = () => {
    if (joinQueueTimeoutRef.current) clearTimeout(joinQueueTimeoutRef.current);
    if (socket) {
      socket.emit('leaveQueue');
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#262522] text-[#bababa] font-sans">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl text-center">
          <div className="bg-[#312e2b] rounded-2xl p-12 shadow-2xl border border-[#3d3935]">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#2c4dbd]/20 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#2c4dbd] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-4">Finding {getModeLabel(selectedTime)} Match</h1>
              <p className="text-xl text-gray-400 mb-2">{status}</p>
              {isSearching && (
                <>
                  <p className="text-sm text-gray-500 mt-4">
                    Matching with another guest player...
                  </p>
                  {timeInQueue < 5 && (
                    <p className="text-xs text-gray-600 mt-2">
                      Minimum wait time: {5 - timeInQueue}s remaining
                    </p>
                  )}
                  {timeInQueue >= 5 && (
                    <p className="text-xs text-green-400 mt-2">
                      Ready to match! Waiting for another player...
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-[#3d3935] hover:bg-[#4a4540] text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              {/* Debug: Show socket connection status */}
              {socket && (
                <div className="px-4 py-2 bg-[#2c4dbd]/20 rounded-lg text-xs">
                  Socket: {socket.connected ? '✅ Connected' : '❌ Disconnected'}
                  {socket.id && ` (${socket.id.slice(0, 8)}...)`}
                </div>
              )}
            </div>

            <div className="mt-8 text-xs text-gray-500">
              <p>* Guest matches are not saved to your account</p>
              <p>* Moves are stored locally only</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestMatchmaking;

