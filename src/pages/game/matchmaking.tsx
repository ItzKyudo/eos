
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api, { getActiveServer, switchToSecondary, PRIMARY_SERVER, SECONDARY_SERVER } from '../../api/axios';
import Sidebar from '../../components/sidebar';



const Matchmaking: React.FC = () => {
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
    const [socketUrl, setSocketUrl] = useState(getActiveServer());

    const socketInstanceRef = useRef<Socket | null>(null);
    const joinQueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (getActiveServer() !== socketUrl) setSocketUrl(getActiveServer());

        // Fetch game modes
        const fetchGameModes = async () => {
            try {
                const response = await api.get('/gamemodes');
                setGameModes(response.data);
            } catch (err) {
                console.error("Error fetching game modes:", err);
            }
        };
        fetchGameModes();

        // Check for auth token
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated
            navigate('/login');
            return;
        }



        // Connect to socket server
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            auth: {
                token: token
            }
        });

        socketInstanceRef.current = newSocket;
        setSocket(newSocket);

        const handleConnect = () => {
            console.log('✅ Connected to server:', newSocket.id);
            setStatus('Connected! Searching for ranked opponent...');
            setIsSearching(true);

            // DELAYED JOIN: Show searching UI immediately, but wait 5s to emit joinQueue
            console.log('⏳ Starting 5s delay before joining queue...');
            joinQueueTimeoutRef.current = setTimeout(() => {
                console.log('📤 5s delay over. Emitting joinQueue with token and time:', selectedTime);
                newSocket.emit('joinQueue', { token, timeControl: selectedTime });
            }, 5000);
        };

        const handleQueued = (data: any) => {
            console.log('⏳ Queued event received:', data);
            setStatus('Waiting for opponent...');
        };

        const handleMatchFound = (data: any) => {
            console.log('🎮 Match found!', data);
            setStatus('Match found! Starting game...');

            if (data && data.yourRole && data.matchId) {
                const gameUrl = `/multiplayer/${data.matchId}`;
                console.log('🚀 Authenticated user navigating to:', gameUrl);

                // Clean up socket BEFORE navigating to allow game page to open its own socket
                newSocket.removeAllListeners();
                newSocket.disconnect();

                setTimeout(() => {
                    console.log('⏱️ Timeout finished, executing navigate');
                    navigate(gameUrl);
                }, 100);
            }
        };

        const handleError = (data: any) => {
            console.error('❌ Socket error:', data);

            // Check for connection error object structure if it differs
            const msg = data.message || (typeof data === 'string' ? data : 'Unknown error');
            setStatus(`Error: ${msg}`);

            if (msg === 'Invalid authentication token') {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user'); // Ensure user is also cleared
                navigate('/');
            }
        };

        const handleConnectError = (err: any) => {
            console.error("Socket connect_error:", err.message);
            if (socketUrl === PRIMARY_SERVER) {
                console.warn("Primary socket unreachable, switching to secondary...");
                switchToSecondary();
                setSocketUrl(SECONDARY_SERVER);
            }
        };

        newSocket.on('connect_error', handleConnectError);

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
            if (joinQueueTimeoutRef.current) clearTimeout(joinQueueTimeoutRef.current);

            const socketToCleanup = socketInstanceRef.current || newSocket;
            if (socketToCleanup && socketToCleanup.connected) {
                socketToCleanup.emit('leaveQueue');
                socketToCleanup.removeAllListeners();
                socketToCleanup.disconnect();
            }
            socketInstanceRef.current = null;
        };

    }, [navigate, socketUrl]);

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
