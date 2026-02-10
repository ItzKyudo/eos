import { useState, useEffect } from 'react';
import { getSocket } from '../config/socket';
import api from '../api/axios';

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

    const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: number, challengerName: string, timeControl: number } | null>(null);
    const [sentChallenge, setSentChallenge] = useState<{ targetUserId: string | number, targetUserName: string, timeControl: number } | null>(null);

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();

        const socket = getSocket();
        if (!socket) return;

        const onConnect = () => {
            // Request initial online status
            socket.emit('getOnlineFriends', (onlineIds: (string | number)[]) => {
                setFriends((prev) => prev.map(f => ({
                    ...f,
                    isOnline: onlineIds.includes(f.user_id)
                })));
            });

            // Check for reconnection if requested
            if (options.checkReconnectionOnConnect) {
                const token = localStorage.getItem('token');
                console.log("Checking for active match on connect...");
                socket.emit('checkReconnection', { token });
            }
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);

        socket.on('onlineUsers', (count: number) => {
            setOnlineCount(count);
        });

        socket.on('friendStatusUpdate', ({ userId, isOnline }: { userId: string | number, isOnline: boolean }) => {
            setFriends((prev) => prev.map(f =>
                String(f.user_id) === String(userId) ? { ...f, isOnline } : f
            ));
        });

        // Challenge Events
        if (options.enableInvites) {
            socket.on('challengeReceived', (challenge) => {
                console.log("Challenge Received:", challenge);
                setIncomingChallenge(challenge);
            });

            socket.on('challengeDeclined', () => {
                setSentChallenge(null);
            });

            socket.on('challengeCancelled', ({ challengerId }) => {
                setIncomingChallenge(prev => {
                    if (prev && String(prev.challengerId) === String(challengerId)) {
                        return null;
                    }
                    return prev;
                });
            });

            socket.on('matchFound', (matchData) => {
                console.log("Match Found via Invite:", matchData);
                setSentChallenge(null);
                setIncomingChallenge(null);
                window.dispatchEvent(new CustomEvent('matchFound', { detail: matchData }));
            });

            const handleLocalChallengeSent = (e: Event) => {
                const detail = (e as CustomEvent).detail;
                setSentChallenge(detail);
            };
            window.addEventListener('challengeSent', handleLocalChallengeSent);

            return () => {
                window.removeEventListener('challengeSent', handleLocalChallengeSent);
                socket.off('connect', onConnect);
                socket.off('onlineUsers');
                socket.off('friendStatusUpdate');
                socket.off('challengeReceived');
                socket.off('challengeDeclined');
                socket.off('challengeCancelled');
                socket.off('matchFound');
            };
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('onlineUsers');
            socket.off('friendStatusUpdate');
        };
    }, [options.enableInvites, options.checkReconnectionOnConnect, options.targetUserId]);

    const sendChallenge = (targetUserId: string | number, timeControl: number, challengerName: string, targetUserName?: string) => {
        getSocket()?.emit('sendChallenge', { targetUserId, timeControl, challengerName });
        window.dispatchEvent(new CustomEvent('challengeSent', {
            detail: { targetUserId, targetUserName: targetUserName || 'Friend', timeControl }
        }));
    };

    const acceptChallenge = (challengerId: string | number, timeControl: number) => {
        getSocket()?.emit('acceptChallenge', { challengerId, timeControl });
        setIncomingChallenge(null);
    };

    const declineChallenge = (challengerId: string | number) => {
        getSocket()?.emit('declineChallenge', { challengerId });
        setIncomingChallenge(null);
    };

    const cancelChallenge = (targetUserId: string | number) => {
        getSocket()?.emit('cancelChallenge', { targetUserId });
        setSentChallenge(null);
    };

    const clearSentChallenge = () => {
        setSentChallenge(null);
    };

    const checkReconnection = () => {
        const token = localStorage.getItem('token');
        if (token) {
            getSocket()?.emit('checkReconnection', { token });
        }
    };

    return {
        friends,
        loading,
        onlineCount,
        incomingChallenge,
        sentChallenge,
        setSentChallenge,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        clearSentChallenge,
        checkReconnection,
        refreshFriends: fetchFriends
    };
};
