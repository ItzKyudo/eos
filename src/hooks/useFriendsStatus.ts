import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Friend {
    friendship_id: number;
    user_id: number;
    username: string;
    avatar_url?: string;
    status_message?: string;
    isOnline?: boolean;
}

export const useFriendsStatus = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<Socket | null>(null);

    const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: number, challengerName: string, timeControl: number } | null>(null);

    useEffect(() => {
        fetchFriends();

        // Setup Socket for status updates
        const token = localStorage.getItem('token');
        if (token) {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
            // Check if we can reuse an existing socket or need a new one
            // ideally we reuse a global socket context, but for now specific for status
            // To avoid multiple connections, we can try to use a slightly different pattern 
            // or just have a lightweight connection if the main game one isn't active.

            const newSocket = io(serverUrl, {
                auth: { token },
                transports: ['websocket']
            });

            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                // Request initial online status
                newSocket.emit('getOnlineFriends', (onlineIds: number[]) => {
                    setFriends(prev => prev.map(f => ({
                        ...f,
                        isOnline: onlineIds.includes(f.user_id)
                    })));
                });
            });

            newSocket.on('friendStatusUpdate', ({ userId, isOnline }: { userId: number, isOnline: boolean }) => {
                setFriends(prev => prev.map(f =>
                    f.user_id === userId ? { ...f, isOnline } : f
                ));
            });

            // Challenge Events
            newSocket.on('challengeReceived', (challenge) => {
                console.log("Challenge Received:", challenge);
                setIncomingChallenge(challenge);
            });

            newSocket.on('challengeDeclined', () => {
                // Optional: Toast notification
                alert("Challenge declined.");
            });

            newSocket.on('matchFound', (matchData) => {
                console.log("Match Found via Invite:", matchData);
                // Dispatch a custom event or let the component handle navigation if it's listening
                // Ideally we return this state or use a global listener.
                // For now, let's emit a window event or just let the hook consumer handle it?
                // Hooks run in components. If multiple components use this hook, all get the event.
                // We'll rely on the consumer (GameSetup) to handle navigation.
                // Or better: store in state?
                // Let's dispatch a window event for navigation to catch it anywhere
                window.dispatchEvent(new CustomEvent('matchFound', { detail: matchData }));
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, []);

    const sendChallenge = (targetUserId: number, timeControl: number, challengerName: string) => {
        socketRef.current?.emit('sendChallenge', { targetUserId, timeControl, challengerName });
    };

    const acceptChallenge = (challengerId: number, timeControl: number) => {
        socketRef.current?.emit('acceptChallenge', { challengerId, timeControl });
        setIncomingChallenge(null);
    };

    const declineChallenge = (challengerId: number) => {
        socketRef.current?.emit('declineChallenge', { challengerId });
        setIncomingChallenge(null);
    };

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
            const response = await fetch(`${serverUrl}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch friends");
            const data = await response.json();

            // Initialize with offline status
            const mappedFriends = (data.friends || []).map((f: any) => ({
                ...f,
                isOnline: false
            }));

            setFriends(mappedFriends);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return { friends, loading, incomingChallenge, sendChallenge, acceptChallenge, declineChallenge };
};
