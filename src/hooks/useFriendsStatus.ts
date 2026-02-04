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

export const useFriendsStatus = (options: { enableInvites?: boolean; checkReconnectionOnConnect?: boolean } = { enableInvites: false, checkReconnectionOnConnect: false }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<Socket | null>(null);

    const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: number, challengerName: string, timeControl: number } | null>(null);

    useEffect(() => {
        fetchFriends();

        // Setup Socket for status updates
        const token = localStorage.getItem('token');
        if (token) {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';

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

                // Check for reconnection if requested
                if (options.checkReconnectionOnConnect) {
                    console.log("Checking for active match on connect...");
                    newSocket.emit('checkReconnection', { token });
                }
            });

            newSocket.on('friendStatusUpdate', ({ userId, isOnline }: { userId: number, isOnline: boolean }) => {
                setFriends(prev => prev.map(f =>
                    f.user_id === userId ? { ...f, isOnline } : f
                ));
            });

            // Challenge Events - Only if enabled (Global Listener)
            if (options.enableInvites) {
                newSocket.on('challengeReceived', (challenge) => {
                    console.log("Challenge Received:", challenge);
                    setIncomingChallenge(challenge);
                });

                newSocket.on('challengeDeclined', () => {
                    // alert("Challenge declined."); // Optional
                });

                newSocket.on('matchFound', (matchData) => {
                    console.log("Match Found via Invite:", matchData);
                    window.dispatchEvent(new CustomEvent('matchFound', { detail: matchData }));
                });
            }

            return () => {
                newSocket.disconnect();
            };
        }
    }, [options.enableInvites]); // Re-run if option changes

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

    const checkReconnection = () => {
        const token = localStorage.getItem('token');
        if (token && socketRef.current) {
            socketRef.current.emit('checkReconnection', { token });
        }
    };

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
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

    return { friends, loading, incomingChallenge, sendChallenge, acceptChallenge, declineChallenge, checkReconnection, refreshFriends: fetchFriends };

};
