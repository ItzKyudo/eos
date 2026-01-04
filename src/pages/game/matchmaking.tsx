
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Sidebar from '../../components/sidebar';

// Module-level flag to prevent duplicate socket creation
let isCreatingSocket = false;
const SOCKET_CREATION_LOCK_DURATION = 2000;

const Matchmaking: React.FC = () => {
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
        // Check for auth token
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated
            navigate('/login');
            return;
        }

        if (isCreatingSocket) {
            return;
        }

        if (socketInstanceRef.current && socketInstanceRef.current.connected) {
            setSocket(socketInstanceRef.current);
            return;
        }

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
            auth: {
                token: token // Start standardizing on auth handshake too, though matchmakingHandler uses payload
            }
        });

        socketInstanceRef.current = newSocket;
        setSocket(newSocket);

        const handleConnect = () => {
            console.log('✅ Connected to server:', newSocket.id);
            setStatus('Connected! Searching for ranked opponent...');
            setIsSearching(true);

            // Join matchmaking queue with token
            console.log('📤 Emitting joinQueue with token...');
            newSocket.emit('joinQueue', { token });
        };

        const handleQueued = (data: any) => {
            console.log('⏳ Queued event received:', data);
            setStatus('Waiting for opponent...');
            setTimeInQueue(0);
        };

        const handleMatchFound = (data: any) => {
            console.log('🎮 Match found!', data);
            setStatus('Match found! Starting game...');

            if (data && data.yourRole && data.matchId) {
                // userId is optional here since we are auth'd, but good to have
                const userIdParam = data.yourUserId ? `&userId=${data.yourUserId}` : '';
                // guest=false is default or explicit
                const gameUrl = `/multiplayer?role=${data.yourRole}&matchId=${data.matchId}&guest=false${userIdParam}&time=${selectedTime}`;

                // Clean up socket BEFORE navigating to allow game page to open its own socket
                newSocket.removeAllListeners();
                newSocket.disconnect();

                setTimeout(() => {
                    navigate(gameUrl);
                }, 100);
            }
        };

        const handleError = (data: any) => {
            console.error('❌ Socket error:', data);
            setStatus(`Error: ${data.message || 'Unknown error'}`);
            if (data.message === 'Invalid authentication token') {
                // Token expired or invalid
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        const handleDisconnect = (reason: string) => {
            console.log('❌ Disconnected:', reason);
            setStatus('Disconnected');
            setIsSearching(false);
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('queued', handleQueued);
        newSocket.on('matchFound', handleMatchFound);
        newSocket.on('error', handleError);
        newSocket.on('disconnect', handleDisconnect);

        if (newSocket.connected) {
            handleConnect();
        }

        const queueTimer = setInterval(() => {
            setTimeInQueue(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(queueTimer);
            const socketToCleanup = socketInstanceRef.current || newSocket;
            if (socketToCleanup && socketToCleanup.connected) {
                socketToCleanup.emit('leaveQueue');
                socketToCleanup.removeAllListeners();
                socketToCleanup.disconnect();
            }
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-green-900/20 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h1 className="text-4xl font-extrabold text-white mb-4">Finding {getModeLabel(selectedTime)} Match</h1>
                            <p className="text-xl text-gray-400 mb-2">{status}</p>
                            {isSearching && (
                                <>
                                    <p className="text-sm text-gray-500 mt-4">
                                        Searching for opponents with similar rating...
                                    </p>
                                    <p className="text-xs text-gray-600 mt-2">
                                        Time in queue: {timeInQueue}s
                                    </p>
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Matchmaking;
