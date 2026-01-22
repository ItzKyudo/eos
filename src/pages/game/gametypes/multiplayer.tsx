import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MultiplayerHUD from '../mechanics/MultiplayerHUD';
import { PlayerRole, GameSyncData, Winner } from '../../../types/gameTypes';
import { getValidMoves, getPieceOwner, PieceKey } from '../mechanics/piecemovements';
import { getValidAttacks, getMandatoryMoves, getMultiCaptureOptions } from '../mechanics/attackpieces';
import { getPieceAtTile } from '../utils/gameUtils';

// Hooks
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useGameLogic } from '../../../hooks/useGameLogic';
import Board from '../../../components/Board';

const Multiplayer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Params
  const myRole = (searchParams.get('role') as PlayerRole) || 'player1';
  const matchId = searchParams.get('matchId');
  const userId = searchParams.get('userId');
  const isGuest = searchParams.get('guest') === 'true';
  const initialTime = parseInt(searchParams.get('time') || '600');
  
  // Player Info
  const myUsername = searchParams.get('myName') || (isGuest ? 'Guest' : 'You');
  const myRating = searchParams.get('myRating') || (isGuest ? '600' : '1200');
  const opponentUsername = searchParams.get('opponentName') || 'Opponent';
  const opponentRating = searchParams.get('opponentRating') || '1200';

  // Local Interaction State
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [disconnectTimerStr, setDisconnectTimerStr] = useState<string>('');
  
  const emitMoveRef = useRef<((s: GameSyncData) => void) | null>(null);
  const emitGameEndRef = useRef<((winner: Winner, reason: string) => void) | null>(null);

  // --- 1. Init Game Logic ---
  const gameLogic = useGameLogic(initialTime, myRole, (newState) => {
    if (emitMoveRef.current) emitMoveRef.current(newState);
  });

  // --- 2. Init Socket ---
  const socketHook = useGameSocket({
    matchId,
    userId,
    myRole,
    onMoveReceived: (move) => gameLogic.applyRemoteMove(move),
    onSyncState: (state) => {
        if (state.lastMove) gameLogic.applyRemoteMove(state.lastMove);
    },
    onOpponentDisconnect: () => {
        gameLogic.setWinner(myRole);
        gameLogic.setGameEndReason('opponent_disconnect');
        gameLogic.setTurnPhase('locked');
    },
    onOpponentReconnect: () => {},
    onGameEnd: (data) => {
        gameLogic.setWinner(data.winner);
        gameLogic.setGameEndReason(data.reason);
        gameLogic.setTurnPhase('locked');
    }
  });

  emitMoveRef.current = socketHook.emitMove;
  emitGameEndRef.current = socketHook.emitGameEnd;

  // --- 3. Interaction Handlers ---

  const handleTileClick = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (gameLogic.winner || gameLogic.turnPhase === 'locked') return;
    if (gameLogic.currentTurn !== myRole) return;

    if (activePiece && validMoves.includes(coordinate)) {
      handlePieceDrop(activePiece, coordinate);
      return;
    }

    if (gameLogic.turnPhase === 'mandatory_move' && gameLogic.gameState[activePiece!] !== coordinate) return;

    const pieceId = getPieceAtTile(gameLogic.gameState, coordinate);
    if (!pieceId) return;
    if (getPieceOwner(pieceId) !== myRole) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();
    setActivePiece(pieceId);

    if (gameLogic.turnPhase === 'select' || gameLogic.turnPhase === 'action') {
      const isFirstMove = !gameLogic.hasMoved[pieceId];
      setValidMoves(getValidMoves(pieceId, coordinate, isFirstMove, gameLogic.gameState as Record<string,string>));
      setValidAttacks(getValidAttacks(pieceId, coordinate, gameLogic.gameState as Record<string,string>, 'pre-move', isFirstMove));
      gameLogic.setTurnPhase('action');
    } 
    else if (gameLogic.turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameLogic.gameState as Record<string,string>);
      let allowedAttacks: string[] = [];
      if (gameLogic.mandatoryMoveUsed) {
         allowedAttacks = getValidAttacks(pieceId, coordinate, gameLogic.gameState as Record<string,string>, 'post-move', false);
      } else {
         const { attacks } = getMultiCaptureOptions(pieceId, coordinate, gameLogic.gameState as Record<string,string>, false);
         allowedAttacks = attacks;
      }
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
     if (result) {
        if (result.winner) {
           setActivePiece(null);
           setValidMoves([]);
           setValidAttacks([]);
        } else {
           setValidAttacks(result.attacks || []);
           setValidMoves(result.moves || []);
        }
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

  // --- 4. Effects ---
  useEffect(() => {
    if (!emitGameEndRef.current) return;
    if (gameLogic.p1Time <= 0 && myRole === 'player1' && !gameLogic.winner) {
      emitGameEndRef.current('player2', 'timeout');
    }
    if (gameLogic.p2Time <= 0 && myRole === 'player2' && !gameLogic.winner) {
      emitGameEndRef.current('player1', 'timeout');
    }
  }, [gameLogic.p1Time, gameLogic.p2Time, myRole, gameLogic.winner]);

  useEffect(() => {
    if (!socketHook.opponentDisconnectTime) {
      setDisconnectTimerStr('');
      return;
    }
    const update = () => {
      const diff = 300000 - (Date.now() - socketHook.opponentDisconnectTime!);
      if (diff <= 0) setDisconnectTimerStr('00:00');
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setDisconnectTimerStr(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    update();
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