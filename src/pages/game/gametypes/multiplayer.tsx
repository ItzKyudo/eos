// src/pages/game/gametypes/multiplayer.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Removed unused useRef
import { useSearchParams, useNavigate } from 'react-router-dom';
import MultiplayerHUD from '../mechanics/MultiplayerHUD';
import { PlayerRole, GameSyncData, Winner } from '../../../types/gameTypes';
import { getValidMoves, getPieceOwner, PieceKey } from '../mechanics/piecemovements';
import { getValidAttacks, getMandatoryMoves, getMultiCaptureOptions } from '../mechanics/attackpieces';
import { getPieceAtTile } from '../utils/gameUtils';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useGameLogic } from '../../../hooks/useGameLogic';
import Board from '../../../components/Board';

const Multiplayer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const myRole = (searchParams.get('role') as PlayerRole) || 'player1';
  const matchId = searchParams.get('matchId');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = searchParams.get('userId') || storedUser.id || storedUser.user_id;
  const isGuest = searchParams.get('guest') === 'true';
  const initialTime = parseInt(searchParams.get('time') || '600');
  
  const myUsername = searchParams.get('myName') || (isGuest ? 'Guest' : storedUser.username || 'You');
  const myRating = searchParams.get('myRating') || (isGuest ? '600' : '1200');
  const opponentUsername = searchParams.get('opponentName') || 'Opponent';
  const opponentRating = searchParams.get('opponentRating') || '1200';

  const gameLogic = useGameLogic(initialTime, myRole, (newState) => {
    socketHook.emitMove(newState);
  });

  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [disconnectTimerStr, setDisconnectTimerStr] = useState<string>('');

  const handleMoveReceived = useCallback((move: GameSyncData) => {
    gameLogic.applyRemoteMove(move);
  }, [gameLogic]);

  const handleSyncState = useCallback((state: any) => {
    if (state.lastMove) gameLogic.applyRemoteMove(state.lastMove);
  }, [gameLogic]);

  const handleOpponentDisconnect = useCallback(() => {
    console.log("Opponent visually disconnected");
  }, []);

  const handleOpponentReconnect = useCallback((data: { socketId: string; userId: string | number }) => {
    console.log("Opponent returned:", data.userId);
  }, []);

  const handleGameEnd = useCallback((data: { winner: Winner; reason: string }) => {
    gameLogic.setWinner(data.winner);
    gameLogic.setGameEndReason(data.reason);
    gameLogic.setTurnPhase('locked');
  }, [gameLogic]);

  const socketHook = useGameSocket({
    matchId,
    userId,
    // Removed myRole as it is no longer in the props definition
    onMoveReceived: handleMoveReceived,
    onSyncState: handleSyncState,
    onOpponentDisconnect: handleOpponentDisconnect,
    onOpponentReconnect: handleOpponentReconnect,
    onGameEnd: handleGameEnd
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
    const update = () => {
      const gracePeriod = 300000;
      const diff = gracePeriod - (Date.now() - socketHook.opponentDisconnectTime!);
      if (diff <= 0) setDisconnectTimerStr('00:00');
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setDisconnectTimerStr(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [socketHook.opponentDisconnectTime]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden relative">
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
                myUsername, myRating, opponentUsername, opponentRating,
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