import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameSyncData, MoveData, PlayerRole, Winner } from '../types/gameTypes';

interface UseGameSocketProps {
  matchId: string | null;
  userId: string | null;
  myRole: PlayerRole;
  onMoveReceived: (move: GameSyncData) => void;
  onOpponentDisconnect: () => void;
  onOpponentReconnect: (data: PlayerReconnectData) => void;
  onGameEnd: (data: { winner: Winner; reason: string }) => void;
  onSyncState: (state: GameStateSync) => void;
}

type GameStateSync = {
  onlinePlayers?: string[];
  players?: Array<{ userId?: string | number; disconnectedAt?: number | null }>;
  lastMove?: GameSyncData;
  [key: string]: unknown;
};

type PlayerReconnectData = {
  userId?: string | number;
  matchId?: string;
  [key: string]: unknown;
};

type GameEndedPayload = {
  matchId?: string;
  winner: Winner;
  reason: string;
  [key: string]: unknown;
};

type OpponentDisconnectPayload = {
  matchId?: string;
  [key: string]: unknown;
};

export const useGameSocket = ({
  matchId,
  userId,
  onMoveReceived,
  onOpponentDisconnect,
  onOpponentReconnect,
  onGameEnd,
  onSyncState
}: UseGameSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [opponentDisconnectTime, setOpponentDisconnectTime] = useState<number | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
    console.log('🔌 Connecting to socket:', serverUrl);

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: { token: localStorage.getItem('token') },
      forceNew: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected:', newSocket.id);
      newSocket.emit('joinGame', { matchId, userId });
    });

    // --- Game Events ---

    newSocket.on('moveMade', (data: MoveData) => {
      if (data.move && data.playerId !== newSocket.id) {
        onMoveReceived(data.move);
      }
    });

     newSocket.on('gameState', (state: GameStateSync) => {
      // Sync presence
      if (state.onlinePlayers && Array.isArray(state.onlinePlayers)) {
         setOpponentConnected(state.onlinePlayers.length > 1);
      }
      // Sync disconnect timer
      if (state.players && Array.isArray(state.players)) {
        const op = state.players.find((p: { userId?: string | number; disconnectedAt?: number | null }) => String(p.userId) !== String(userId));
         if (op?.disconnectedAt) setOpponentDisconnectTime(op.disconnectedAt);
         else setOpponentDisconnectTime(null);
      }
      onSyncState(state);
    });

     newSocket.on('gameEnded', (data: GameEndedPayload) => {
       if (data.matchId === matchId) onGameEnd(data);
     });

    // --- Player Presence Events ---
    
    newSocket.on('playerJoined', () => setOpponentConnected(true));
    newSocket.on('playerReconnected', (data: PlayerReconnectData) => {
      setOpponentConnected(true);
      onOpponentReconnect(data);
    });
    newSocket.on('playerDisconnected', () => setOpponentConnected(false));
    newSocket.on('playerLeft', () => setOpponentConnected(false));
    
    newSocket.on('opponentDisconnected', (data: OpponentDisconnectPayload) => {
       if (data.matchId === matchId) {
         setOpponentConnected(false);
         onOpponentDisconnect();
       }
    });

    // Heartbeat
    const hbInterval = setInterval(() => {
       if (newSocket.connected) newSocket.emit('playerHeartbeat', { matchId });
    }, 5000);

    return () => {
      clearInterval(hbInterval);
      newSocket.disconnect();
    };
  }, [matchId, userId, onMoveReceived, onOpponentDisconnect, onOpponentReconnect, onGameEnd, onSyncState]);

  const emitMove = (moveData: GameSyncData) => {
    if (socket?.connected && matchId) {
      socket.emit('makeMove', { matchId, move: moveData });
    }
  };

  const emitGameEnd = (winner: Winner, reason: string) => {
    if (socket?.connected && matchId) {
      socket.emit('gameEnd', { matchId, winner, reason });
    }
  };

  const emitLeave = () => {
     if (socket?.connected && matchId) {
        socket.emit('leaveGame', { matchId });
     }
  };

  return { 
    socket, 
    opponentConnected, 
    opponentDisconnectTime,
    emitMove,
    emitGameEnd,
    emitLeave
  };
};