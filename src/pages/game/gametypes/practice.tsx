import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// FIXED: PlayerRole is now in gameTypes, not piecemovements
import { PlayerRole } from '../../../types/gameTypes'; 
import { PieceKey, getPieceOwner } from '../mechanics/piecemovements'; 
import { getValidMoves } from '../mechanics/piecemovements';
import { getValidAttacks, getMandatoryMoves, getMultiCaptureOptions } from '../mechanics/attackpieces';
import { getPieceAtTile } from '../utils/gameUtils';

// Modular Components & Hooks
import Board from '../../../components/Board';
import MultiplayerHUD from '../mechanics/MultiplayerHUD';
import { useGameLogic } from '../../../hooks/useGameLogic';

const Practice: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Settings
  const initialTime = parseInt(searchParams.get('time') || '600', 10);
  
  // Local View State
  const [viewPerspective, setViewPerspective] = useState<PlayerRole>('player1');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);

  // --- 1. Init Game Logic ---
  const gameLogic = useGameLogic(initialTime, 'player1', () => {});

  // FIXED: Destructure these so useEffect dependencies are clean
  const { 
    currentTurn, 
    winner, 
    turnPhase, 
    gameState, 
    moveHistory, 
    hasMoved, 
    mandatoryMoveUsed, 
    p1Time, 
    p2Time, 
    capturedByP1, 
    capturedByP2,
    setWinner
  } = gameLogic;

  // --- 2. Auto-Rotate Effect ---
  useEffect(() => {
    if (isAutoRotate) {
      setViewPerspective(currentTurn);
    }
  }, [currentTurn, isAutoRotate]);

  // --- 3. Interaction Handlers ---

  const handleTileClick = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked') return;

    // 1. Move/Drop Logic
    if (activePiece && validMoves.includes(coordinate)) {
      handlePieceDrop(activePiece, coordinate);
      return;
    }

    // Prevent selecting other pieces during mandatory move (unless it's the active one)
    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    // 2. Select Piece Logic
    const pieceId = getPieceAtTile(gameState, coordinate);
    if (!pieceId) return;
    
    // Strict turn enforcement
    if (getPieceOwner(pieceId) !== currentTurn) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();
    setActivePiece(pieceId);

    // Calculate Valid Options
    if (turnPhase === 'select' || turnPhase === 'action') {
      const isFirstMove = !hasMoved[pieceId];
      setValidMoves(getValidMoves(pieceId, coordinate, isFirstMove, gameState as Record<string,string>));
      setValidAttacks(getValidAttacks(pieceId, coordinate, gameState as Record<string,string>, 'pre-move', isFirstMove));
      gameLogic.setTurnPhase('action');
    } 
    else if (turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>);
      let allowedAttacks: string[] = [];
      
      if (mandatoryMoveUsed) {
         allowedAttacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'post-move', false);
      } else {
         const { attacks } = getMultiCaptureOptions(pieceId, coordinate, gameState as Record<string, string>, false);
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

  // --- 4. Render Helpers ---

  const handleExit = () => {
    navigate('/');
  };

  // Check for timeouts
  // FIXED: Removed missing 'gameLogic' dependency by using destructured values
  useEffect(() => {
    if (p1Time <= 0 && !winner) setWinner('player2');
    if (p2Time <= 0 && !winner) setWinner('player1');
  }, [p1Time, p2Time, winner, setWinner]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden relative">
        
        {/* Practice Mode Controls */}
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
               // FIXED: Explicitly typed 'prev' to fix implicit any error
               onClick={() => setViewPerspective((prev: PlayerRole) => prev === 'player1' ? 'player2' : 'player1')}
               className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-md border border-neutral-600"
             >
               Flip Board ↻
             </button>
           )}
        </div>

        {/* Board */}
        <Board
           gameState={gameState}
           perspective={viewPerspective} 
           turnPhase={turnPhase}
           currentTurn={currentTurn}
           winner={winner}
           validMoves={validMoves}
           validAttacks={validAttacks}
           activePiece={activePiece}
           onTileClick={handleTileClick}
           onPieceDrop={handlePieceDrop}
           onAttackClick={handleAttackClick}
        />

        {/* HUD */}
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