import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MultiplayerHUD from '../mechanics/MultiplayerHUD';
import { PlayerRole, GameSyncData, Winner } from '../../../types/gameTypes';
import { getValidMoves, getPieceOwner, PieceKey } from '../mechanics/piecemovements';
import { getValidAttacks, getMandatoryMoves, getMultiCaptureOptions } from '../mechanics/attackpieces';
import { getPieceAtTile } from '../utils/gameUtils';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useGameLogic } from '../../../hooks/useGameLogic';
import Board from '../../../components/Board';

// Local interface for sync state
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
}

const Multiplayer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const myRole = (searchParams.get('role') as PlayerRole) || 'player1';
  const matchId = searchParams.get('matchId');
  
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = searchParams.get('userId') || storedUser.id || storedUser.user_id;
  
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [disconnectTimerStr, setDisconnectTimerStr] = useState<string>('');

  const initialTime = parseInt(searchParams.get('time') || '600');

  const gameLogic = useGameLogic(initialTime, myRole, (newState) => {
    socketHook.emitMove(newState);
  });

  const onMoveReceived = useCallback((move: GameSyncData) => {
    gameLogic.applyRemoteMove(move);
  }, [gameLogic]);

  const onSyncState = useCallback((state: GameStateSync) => {
    if (state.lastMove) gameLogic.applyRemoteMove(state.lastMove);
  }, [gameLogic]);

  const onOpponentReconnect = useCallback((data: { socketId: string; userId: string }) => {
    console.log("Opponent Reconnected:", data.userId);
  }, []);

  const onGameEnd = useCallback((data: { winner: Winner; reason: string }) => {
    gameLogic.setWinner(data.winner);
    gameLogic.setGameEndReason(data.reason);
    gameLogic.setTurnPhase('locked');
  }, [gameLogic]);

  const socketHook = useGameSocket({
    matchId,
    userId,
    onMoveReceived,
    onSyncState,
    onOpponentDisconnect: () => {},
    onOpponentReconnect,
    onGameEnd
  });

  const handleTileClick = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (gameLogic.winner || gameLogic.turnPhase === 'locked' || gameLogic.currentTurn !== myRole) return;

    if (activePiece && validMoves.includes(coordinate)) {
      handlePieceDrop(activePiece, coordinate);
      return;
    }

    const pieceId = getPieceAtTile(gameLogic.gameState, coordinate);
    if (!pieceId || getPieceOwner(pieceId) !== myRole) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();
    setActivePiece(pieceId);

    const isFirstMove = !gameLogic.hasMoved[pieceId];
    const capturedFirst = gameLogic.startWithCapture[pieceId] || false;

    if (gameLogic.turnPhase === 'select' || gameLogic.turnPhase === 'action') {
      setValidMoves(getValidMoves(pieceId, coordinate, isFirstMove, gameLogic.gameState as Record<string, string>, capturedFirst));
      setValidAttacks(getValidAttacks(pieceId, coordinate, gameLogic.gameState as Record<string, string>, 'pre-move', isFirstMove));
      gameLogic.setTurnPhase('action');
    } 
    else if (gameLogic.turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameLogic.gameState as Record<string, string>, capturedFirst);
      const allowedAttacks = gameLogic.mandatoryMoveUsed 
        ? getValidAttacks(pieceId, coordinate, gameLogic.gameState as Record<string, string>, 'post-move', false)
        : getMultiCaptureOptions(pieceId, coordinate, gameLogic.gameState as Record<string, string>, false, capturedFirst).attacks;
      setValidMoves(allowedMoves);
      setValidAttacks(allowedAttacks);
    }
  };

  const handlePieceDrop = (pieceId: PieceKey, targetCoord: string) => {
    const result = gameLogic.executeMove(pieceId, targetCoord);
    setValidMoves([]);
    setValidAttacks(result.attacks);
    if (result.nextPhase === 'locked') setActivePiece(null);
  };

  const handleAttackClick = (targetCoord: string) => {
    if (!activePiece) return;
    const result = gameLogic.executeAttackAction(targetCoord, activePiece);
    if (result && !result.winner) {
       setValidAttacks(result.attacks || []);
       setValidMoves(result.moves || []);
    }
  };

  const handleSwitchTurn = () => {
    gameLogic.switchTurn();
    setActivePiece(null);
    setValidMoves([]);
    setValidAttacks([]);
  };

  const handleExit = () => {
    socketHook.emitLeave();
    navigate('/');
  };

  useEffect(() => {
    if (!socketHook.opponentDisconnectTime) {
      setDisconnectTimerStr('');
      return;
    }
    const interval = setInterval(() => {
      const diff = 300000 - (Date.now() - socketHook.opponentDisconnectTime!);
      if (diff <= 0) {
        setDisconnectTimerStr('00:00');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setDisconnectTimerStr(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [socketHook.opponentDisconnectTime]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden relative">
        {/* display socket id */}
        <div className="fixed top-2 left-2 z-100 bg-black/60 text-white p-2 rounded text-[10px] font-mono pointer-events-none border border-white/10">
          ID: {socketHook.socket?.id || 'Connecting...'}
        </div>

        <Board
           gameState={gameLogic.gameState}
           perspective={myRole}
           turnPhase={gameLogic.turnPhase}
           currentTurn={gameLogic.currentTurn}
           winner={gameLogic.winner}
           validMoves={validMoves}
           validAttacks={validAttacks}
           activePiece={activePiece}
           onTileClick={handleTileClick}
           onPieceDrop={handlePieceDrop}
           onAttackClick={handleAttackClick}
        />

        <MultiplayerHUD
            myRole={myRole}
            winner={gameLogic.winner}
            gameEndReason={gameLogic.gameEndReason}
            gameState={{
                currentTurn: gameLogic.currentTurn,
                moves: gameLogic.moveHistory,
                p1Time: gameLogic.p1Time,
                p2Time: gameLogic.p2Time,
                capturedByP1: gameLogic.capturedByP1,
                capturedByP2: gameLogic.capturedByP2
            }}
            playerDetails={{
                myUsername: storedUser.username || 'You',
                opponentUsername: searchParams.get('opponentName') || 'Opponent',
                opponentConnected: socketHook.opponentConnected,
                disconnectTimer: disconnectTimerStr
            }}
            canSwitchTurn={gameLogic.turnPhase === 'locked' && gameLogic.currentTurn === myRole}
            onSwitchTurn={handleSwitchTurn}
            onExit={handleExit}
        />
    </div>
  );
};

export default Multiplayer;