import { io, Socket } from 'socket.io-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';

let socket: Socket | null = null;

export const getSocket = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        return null;
    }

    if (!socket) {
        socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket?.id);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
            if (err.message === "Invalid authentication token" || err.message === "Authentication error") {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // The server has forcefully disconnected the socket, transition to manual reconnect
                socket?.connect();
            }
        });
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
