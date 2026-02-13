import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api, { getActiveServer, switchToSecondary, PRIMARY_SERVER, SECONDARY_SERVER } from '../api/axios';

interface Friend {
    friendship_id: number;
    user_id: string | number; // Support UUIDs
    username: string;
    avatar_url?: string;
    status_message?: string;
    isOnline?: boolean;
}

export const useFriendsStatus = (options: {
    enableInvites?: boolean;
    checkReconnectionOnConnect?: boolean;
    targetUserId?: string | number;
} = { enableInvites: false, checkReconnectionOnConnect: false }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [socketUrl, setSocketUrl] = useState(getActiveServer());
    const socketRef = useRef<Socket | null>(null);

    const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: number, challengerName: string, timeControl: number } | null>(null);

    const fetchFriends = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const url = options.targetUserId ? `/friends?userId=${options.targetUserId}` : '/friends';
            const response = await api.get(url);
            const data = response.data;

            // Initialize with offline status
            const mappedFriends = (data.friends || []).map((f: any) => ({
                ...f,
                isOnline: false,
                user_id: f.user_id // Preserve ID type
            }));

            setFriends(mappedFriends);
        } catch (err) {
            console.error(err);
            // 401/403 errors are now handled by the interceptor
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Sync with global active server if it changed elsewhere
        if (getActiveServer() !== socketUrl) {
            setSocketUrl(getActiveServer());
        }

        fetchFriends();

        // Setup Socket for status updates
        const token = localStorage.getItem('token');
        if (token) {
            // Avoid creating multiple sockets if possible, but for now ensure clean disconnect
            const newSocket = io(socketUrl, {
                auth: { token },
                transports: ['websocket']
            });

            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                // Request initial online status
                newSocket.emit('getOnlineFriends', (onlineIds: (string | number)[]) => {
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

            newSocket.on('connect_error', (err) => {
                console.error("Socket connection error:", err.message);

                if (socketUrl === PRIMARY_SERVER) {
                    console.warn('Socket unreachable on Primary. Switching to Secondary.');
                    switchToSecondary();
                    setSocketUrl(SECONDARY_SERVER);
                }

                if (err.message === "Invalid authentication token" || err.message === "Authentication error") {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // We need to use window.location because navigate might not be available if not in Router context? 
                    // But this hook is used in components inside Router.
                    // However, to be safe and simple in a hook without passing navigate:
                    window.location.href = '/';
                }
            });

            newSocket.on('onlineUsers', (count: number) => {
                setOnlineCount(count);
            });

            newSocket.on('friendStatusUpdate', ({ userId, isOnline }: { userId: string | number, isOnline: boolean }) => {
                setFriends(prev => prev.map(f =>
                    // Ensure type-safe comparison (toString() just in case)
                    String(f.user_id) === String(userId) ? { ...f, isOnline } : f
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
    }, [options.enableInvites, socketUrl]); // Re-run if option changes or server switches

    const sendChallenge = (targetUserId: string | number, timeControl: number, challengerName: string) => {
        socketRef.current?.emit('sendChallenge', { targetUserId, timeControl, challengerName });
    };

    const acceptChallenge = (challengerId: string | number, timeControl: number) => {
        socketRef.current?.emit('acceptChallenge', { challengerId, timeControl });
        setIncomingChallenge(null);
    };

    const declineChallenge = (challengerId: string | number) => {
        socketRef.current?.emit('declineChallenge', { challengerId });
        setIncomingChallenge(null);
    };

    const checkReconnection = () => {
        const token = localStorage.getItem('token');
        if (token && socketRef.current) {
            socketRef.current.emit('checkReconnection', { token });
        }
    };

    return { friends, loading, onlineCount, incomingChallenge, sendChallenge, acceptChallenge, declineChallenge, checkReconnection, refreshFriends: fetchFriends };
};
