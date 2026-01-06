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

            return () => {
                newSocket.disconnect();
            };
        }
    }, []);

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

    return { friends, loading };
};
