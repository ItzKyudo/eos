import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Sidebar from '../../components/sidebar';

// Define interfaces to eliminate 'any'
interface MatchData {
    yourRole: string;
    matchId: string;
    yourUserId?: string;
    yourUsername?: string;
    yourRating?: string;
    opponent?: {
        username: string;
        rating: string;
    };
    timeControl?: number;
}

interface GameMode {
    duration_minutes: number;
    title: string;
}

const Matchmaking: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedTime = parseInt(searchParams.get('time') || '600');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState<string>('Connecting...');
    const [timeInQueue, setTimeInQueue] = useState<number>(0);
    const [gameModes, setGameModes] = useState<GameMode[]>([]);

    const joinQueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getModeLabel = (time: number) => {
        if (!gameModes.length) return `${time / 60}m Game`;
        const mode = gameModes.find((m) => m.duration_minutes === time / 60);
        return mode ? `${mode.title} (${mode.duration_minutes}m)` : `${time / 60}m Game`;
    };

    useEffect(() => {
        const fetchGameModes = async () => {
            try {
                const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
                const response = await fetch(`${serverUrl}/api/gamemodes`);
                if (response.ok) {
                    const data: GameMode[] = await response.json();
                    setGameModes(data);
                }
            } catch (err) { console.error(err); }
        };
        fetchGameModes();

        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
        const newSocket = io(serverUrl, {
            transports: ['websocket'],
            auth: { token }
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setStatus('Connected! Searching...');
            joinQueueTimeoutRef.current = setTimeout(() => {
                newSocket.emit('joinQueue', { token, timeControl: selectedTime });
            }, 5000);
        });

        newSocket.on('matchFound', (data: MatchData) => {
            setStatus('Match found! Starting game...');
            
            newSocket.removeAllListeners();
            newSocket.disconnect();

            if (data && data.yourRole && data.matchId) {
                const userIdParam = data.yourUserId ? `&userId=${data.yourUserId}` : '';
                const myNameParam = data.yourUsername ? `&myName=${encodeURIComponent(data.yourUsername)}` : '';
                const myRatingParam = data.yourRating ? `&myRating=${data.yourRating}` : '';
                const opponentNameParam = data.opponent?.username ? `&opponentName=${encodeURIComponent(data.opponent.username)}` : '';
                const opponentRatingParam = data.opponent?.rating ? `&opponentRating=${data.opponent.rating}` : '';

                const gameUrl = `/multiplayer?role=${data.yourRole}&matchId=${data.matchId}&guest=false${userIdParam}${myNameParam}${myRatingParam}${opponentNameParam}${opponentRatingParam}&time=${selectedTime}`;
                
                setTimeout(() => {
                    navigate(gameUrl);
                }, 500);
            }
        });

        newSocket.on('error', (data: { message?: string }) => {
            setStatus(`Error: ${data.message || 'Unknown error'}`);
        });

        const queueTimer = setInterval(() => setTimeInQueue(prev => prev + 1), 1000);

        return () => {
            clearInterval(queueTimer);
            if (joinQueueTimeoutRef.current) clearTimeout(joinQueueTimeoutRef.current);
            newSocket.disconnect();
        };
    }, [navigate, selectedTime]);


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
                <div className="w-full max-w-2xl text-center bg-[#312e2b] rounded-2xl p-12 border border-[#3d3935] shadow-2xl">
                    <div className="w-24 h-24 mx-auto mb-6 bg-green-900/20 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Finding {getModeLabel(selectedTime)}</h1>
                    <p className="text-xl text-gray-400">{status}</p>
                    <p className="text-xs text-gray-600 mt-4">Queue Time: {timeInQueue}s</p>
                    <button onClick={handleCancel} className="mt-8 px-6 py-3 bg-[#3d3935] hover:bg-[#4a4540] text-white rounded-lg font-semibold">Cancel</button>
                </div>
            </main>
        </div>
    );
};

export default Matchmaking;