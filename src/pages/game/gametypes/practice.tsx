import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { PlayerRole } from '../../../types/gameTypes'; 
import { PieceKey, getPieceOwner } from '../mechanics/piecemovements'; 
import { getValidMoves } from '../mechanics/piecemovements';
import { getValidAttacks, getMandatoryMoves, getMultiCaptureOptions } from '../mechanics/attackpieces';
import { getPieceAtTile } from '../utils/gameUtils';

import Board from '../../../components/Board';
import MultiplayerHUD from '../mechanics/MultiplayerHUD';
import { useGameLogic } from '../../../hooks/useGameLogic';

const Practice: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTime = parseInt(searchParams.get('time') || '600', 10);
  
  const [viewPerspective, setViewPerspective] = useState<PlayerRole>('player1');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);

  const gameLogic = useGameLogic(initialTime, 'player1', () => {}, true);

  const { 
    currentTurn, 
    winner, 
    turnPhase, 
    gameState, 
    moveHistory, 
    hasMoved, 
    startWithCapture,
    p1Time, 
    p2Time, 
    capturedByP1, 
    capturedByP2,
    setWinner,
    mandatoryMoveUsed
  } = gameLogic;

  useEffect(() => {
    if (isAutoRotate) {
      setViewPerspective(currentTurn);
    }
  }, [currentTurn, isAutoRotate]);

  const handleTileClick = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked') return;

    if (activePiece && validMoves.includes(coordinate)) {
      handlePieceDrop(activePiece, coordinate);
      return;
    }

    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    const pieceId = getPieceAtTile(gameState, coordinate);
    if (!pieceId) return;
    
    if (getPieceOwner(pieceId) !== currentTurn) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();
    setActivePiece(pieceId);

    if (turnPhase === 'select' || turnPhase === 'action') {
      const isFirstMove = !hasMoved[pieceId];
      const capturedFirst = startWithCapture[pieceId] || false;

      // FIXED: Ensure getValidMoves definition matches this 5-argument call
      setValidMoves(getValidMoves(pieceId, coordinate, isFirstMove, gameState as Record<string,string>, capturedFirst));
      setValidAttacks(getValidAttacks(pieceId, coordinate, gameState as Record<string,string>, 'pre-move', isFirstMove));
      gameLogic.setTurnPhase('action');
    } 
    else if (turnPhase === 'mandatory_move') {
      const capturedFirst = startWithCapture[pieceId] || false;
      // FIXED: Ensure getMandatoryMoves definition matches this 4-argument call
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>, capturedFirst);
      
      let allowedAttacks: string[] = [];
      if (mandatoryMoveUsed) {
         allowedAttacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'post-move', false);
      } else {
         // FIXED: Ensure getMultiCaptureOptions definition matches this 5-argument call
         const { attacks } = getMultiCaptureOptions(pieceId, coordinate, gameState as Record<string, string>, false, capturedFirst);
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

  const handleExit = () => navigate('/');

  useEffect(() => {
    if (p1Time <= 0 && !winner) setWinner('player2');
    if (p2Time <= 0 && !winner) setWinner('player1');
  }, [p1Time, p2Time, winner, setWinner]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
           <button 
             onClick={() => {
                setIsAutoRotate(!isAutoRotate);
                if (!isAutoRotate) setViewPerspective(currentTurn);
             }}
             className={`px-3 py-1.5 rounded text-xs font-bold shadow-md border transition-all ${isAutoRotate ? 'bg-green-700 border-green-500 text-white' : 'bg-neutral-700 border-neutral-600 text-neutral-400'}`}
           >
             {isAutoRotate ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF'}
           </button>
           
           {!isAutoRotate && (
             <button
               onClick={() => setViewPerspective((prev: PlayerRole) => prev === 'player1' ? 'player2' : 'player1')}
               className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-md border border-neutral-600"
             >
               Flip Board ↻
             </button>
           )}
        </div>

        <Board
           gameState={gameState}
           perspective={viewPerspective} 
           turnPhase={turnPhase}
           currentTurn={currentTurn}
           winner={winner}
           validMoves={validMoves}
           validAttacks={validAttacks}
           activePiece={activePiece}
           hasMoved={hasMoved}
           onTileClick={handleTileClick}
           onPieceDrop={handlePieceDrop}
           onAttackClick={handleAttackClick}
        />

        <MultiplayerHUD
            myRole={currentTurn} 
            winner={winner}
            gameEndReason={null}
            gameState={{
                currentTurn: currentTurn,
                moves: moveHistory,
                p1Time: p1Time,
                p2Time: p2Time,
                capturedByP1: capturedByP1,
                capturedByP2: capturedByP2
            }}
            playerDetails={{
                myUsername: currentTurn === 'player1' ? 'Player 1 (Green)' : 'Player 2 (Blue)',
                myRating: 'Local',
                opponentUsername: currentTurn === 'player1' ? 'Player 2 (Blue)' : 'Player 1 (Green)',
                opponentRating: 'Local',
                opponentConnected: true,
                disconnectTimer: ''
            }}
            canSwitchTurn={turnPhase === 'locked'}
            onSwitchTurn={handleSwitchTurn}
            onExit={handleExit}
        />
    </div>
  );
};

export default Practice;