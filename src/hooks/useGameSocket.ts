import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameSyncData, MoveData, Winner } from '../types/gameTypes';

interface PlayerStatus {
  userId: string | number;
  username: string;
  disconnectedAt: number | null;
  isGuest: boolean;
}

interface GameStateSync extends GameSyncData {
  players?: PlayerStatus[];
  lastMove?: GameSyncData;
  onlinePlayers?: string[];
  rehydratedFromDB?: boolean;
}

interface UseGameSocketProps {
  matchId: string | null;
  userId: string | null;
  onMoveReceived: (move: GameSyncData) => void;
  onOpponentDisconnect: () => void;
  onOpponentReconnect: (data: { socketId: string; userId: string | number }) => void;
  onGameEnd: (data: { matchId: string; winner: Winner; reason: string }) => void;
  onSyncState: (state: GameStateSync) => void;
}

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
  const hbRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const connectionDelay = setTimeout(() => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
      
      const newSocket = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: { token: localStorage.getItem('token') },
        forceNew: true
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('joinGame', { matchId, userId });
      });

      newSocket.on('moveMade', (data: MoveData) => {
        if (data.move && data.playerId !== newSocket.id) {
          onMoveReceived(data.move);
        }
      });

      newSocket.on('gameState', (state: GameStateSync) => {
        if (state.onlinePlayers) {
          setOpponentConnected(state.onlinePlayers.length > 1);
        }

        if (state.players) {
          const opponent = state.players.find((p) => String(p.userId) !== String(userId));
          if (opponent?.disconnectedAt) setOpponentDisconnectTime(opponent.disconnectedAt);
          else setOpponentDisconnectTime(null);
        }
        onSyncState(state);
      });

      newSocket.on('playerJoined', () => setOpponentConnected(true));
      
      newSocket.on('playerReconnected', (data: { socketId: string; userId: string | number }) => {
        setOpponentConnected(true);
        onOpponentReconnect(data);
      });

      newSocket.on('playerDisconnected', () => setOpponentConnected(false));
      
      newSocket.on('opponentDisconnected', (data: { matchId: string }) => {
         if (data.matchId === matchId) {
           setOpponentConnected(false);
           onOpponentDisconnect();
         }
      });

      newSocket.on('gameEnded', (data: { matchId: string; winner: Winner; reason: string }) => {
        onGameEnd(data);
      });

      hbRef.current = setInterval(() => {
         if (newSocket.connected) newSocket.emit('playerHeartbeat', { matchId });
      }, 5000);

    }, 800);

    return () => {
      clearTimeout(connectionDelay);
      if (hbRef.current) clearInterval(hbRef.current);
      if (socket) socket.disconnect();
    };
  }, [matchId, userId, onGameEnd, onMoveReceived, onOpponentDisconnect, onOpponentReconnect, onSyncState, socket]);

  const emitMove = useCallback((moveData: GameSyncData) => {
    if (socket?.connected) socket.emit('makeMove', { matchId, move: moveData });
  }, [socket, matchId]);

  const emitGameEnd = useCallback((winner: Winner, reason: string) => {
    if (socket?.connected) socket.emit('gameEnd', { matchId, winner, reason });
  }, [socket, matchId]);

  const emitLeave = useCallback(() => {
    if (socket?.connected) socket.emit('leaveGame', { matchId });
  }, [socket, matchId]);

  return { socket, opponentConnected, opponentDisconnectTime, emitMove, emitGameEnd, emitLeave };
};