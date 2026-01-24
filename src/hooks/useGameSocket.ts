import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameSyncData, MoveData, PlayerRole, Winner } from '../types/gameTypes';

// Define specific interfaces to replace 'any'
interface PlayerStatus {
  userId: string | number;
  username: string;
  disconnectedAt: number | null;
  isGuest: boolean;
}

interface GameStateSync extends GameSyncData {
  players?: PlayerStatus[];
  lastMove?: GameSyncData;
}

interface UseGameSocketProps {
  matchId: string | null;
  userId: string | null;
  myRole: PlayerRole;
  onMoveReceived: (move: GameSyncData) => void;
  onOpponentDisconnect: () => void;
  onOpponentReconnect: (data: { socketId: string; userId: string | number }) => void;
  onGameEnd: (data: { matchId?: string; winner: Winner; reason: string }) => void;
  onSyncState: (state: GameStateSync) => void;
}

export const useGameSocket = ({
  matchId,
  userId,
  // FIXED: Removed myRole from destructuring as it was unused
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
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
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
      if (state.players) {
        const opponent = state.players.find((p) => String(p.userId) !== String(userId));
        const isOpOnline = state.onlinePlayers?.includes(String(opponent?.userId));
        setOpponentConnected(!!isOpOnline);

        if (opponent?.disconnectedAt) setOpponentDisconnectTime(opponent.disconnectedAt);
        else setOpponentDisconnectTime(null);
      }
      onSyncState(state);
    });

    newSocket.on('gameEnded', (data: { matchId?: string; winner: Winner; reason: string }) => {
      if (data.matchId === matchId) onGameEnd(data);
    });

    newSocket.on('playerJoined', () => setOpponentConnected(true));
    
    newSocket.on('playerReconnected', (data: { socketId: string; userId: string | number }) => {
      setOpponentConnected(true);
      onOpponentReconnect(data);
    });

    newSocket.on('playerDisconnected', () => setOpponentConnected(false));
    
    newSocket.on('opponentDisconnected', (data: { matchId?: string }) => {
       if (data.matchId === matchId) {
         setOpponentConnected(false);
         onOpponentDisconnect();
       }
    });

    const hbInterval = setInterval(() => {
       if (newSocket.connected) newSocket.emit('playerHeartbeat', { matchId });
    }, 5000);

    return () => {
      clearInterval(hbInterval);
      newSocket.disconnect();
    };
  }, [matchId, userId, onGameEnd, onMoveReceived, onOpponentDisconnect, onOpponentReconnect, onSyncState]);

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

  return { socket, opponentConnected, opponentDisconnectTime, emitMove, emitGameEnd, emitLeave };
};