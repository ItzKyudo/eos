import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Sidebar from '../../components/sidebar';

// Module-level flag to prevent duplicate socket creation (React Strict Mode protection)
// This persists across component remounts in Strict Mode
let isCreatingSocket = false;
const SOCKET_CREATION_LOCK_DURATION = 2000; // 2 second lock to prevent duplicates

const GuestMatchmaking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTime = parseInt(searchParams.get('time') || '600');

  const getModeLabel = (time: number) => {
    if (time === 60) return 'Bullet (1m)';
    if (time === 300) return 'Blitz (5m)';
    return 'Rapid (10m)';
  };
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  const [isSearching, setIsSearching] = useState(false);
  const [timeInQueue, setTimeInQueue] = useState<number>(0);
  const socketInstanceRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prevent duplicate socket creation (React Strict Mode causes double execution)
    if (isCreatingSocket) {
      console.log('⚠️ Socket creation already in progress, skipping duplicate creation');
      return;
    }

    // Check if socket already exists in component
    if (socketInstanceRef.current && socketInstanceRef.current.connected) {
      console.log('⚠️ Socket already exists in component, skipping creation');
      setSocket(socketInstanceRef.current);
      return;
    }

    // Set flag to prevent duplicate creation
    isCreatingSocket = true;
    setTimeout(() => {
      isCreatingSocket = false;
    }, SOCKET_CREATION_LOCK_DURATION);

    // Connect to socket server
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstanceRef.current = newSocket;
    setSocket(newSocket);

    // Socket event handlers - set these up BEFORE emitting joinGuestQueue
    const handleConnect = () => {
      console.log('✅ Connected to server:', newSocket.id);
      setStatus('Connected! Searching for opponent...');
      setIsSearching(true);

      // Join guest queue
      console.log('📤 Emitting joinQueue...');
      newSocket.emit('joinQueue', {});
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
        // Use userId from server if available (for reconnection reliability)
        const userIdParam = data.yourUserId ? `&userId=${data.yourUserId}` : '';
        const gameUrl = `/multiplayer?role=${data.yourRole}&matchId=${data.matchId}&guest=true${userIdParam}&time=${selectedTime}`;
        console.log('🚀 Navigating to game:', gameUrl);
        console.log('📍 Current location:', window.location.pathname);

        // Disconnect the matchmaking socket - the game page will create a new one
        // This allows the server to recognize the new socket as a reconnection
        console.log('🔌 Disconnecting matchmaking socket to allow game socket to reconnect');
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

      // Properly clean up socket connection (only if still connected)
      const socketToCleanup = socketInstanceRef.current || newSocket;
      if (socketToCleanup && socketToCleanup.connected) {
        console.log('🔌 Leaving queue and disconnecting socket...');
        socketToCleanup.emit('leaveQueue');
        socketToCleanup.removeAllListeners();
        socketToCleanup.disconnect();
      }

      // Clear component ref
      socketInstanceRef.current = null;
    };

  }, [navigate]);

  const handleCancel = () => {
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

