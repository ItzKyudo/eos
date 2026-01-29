import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PIECES, PieceKey, getValidMoves, getPieceOwner, PIECE_MOVEMENTS } from '../mechanics/piecemovements';
import { BOARD_COLUMNS } from '../utils/gameUtils';
import { INITIAL_POSITIONS } from '../mechanics/positions';
import MoveHistory, { useGameHistory } from '../mechanics/MoveHistory';
import { getValidAttacks, getMandatoryMoves, executeAttack, getMultiCaptureOptions, Winner } from '../mechanics/attackpieces';

const Board: React.FC = () => {
  const [searchParams] = useSearchParams();
  const timeLimit = parseInt(searchParams.get('time') || '600', 10);
  const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [pieceMoveCount, setPieceMoveCount] = useState<Record<string, number>>({});
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [winner, setWinner] = useState<Winner>(null);
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'locked'>('auto');
  const [perspective, setPerspective] = useState<'player1' | 'player2'>('player1');
  const { moveHistory, capturedByP1, capturedByP2, addMove, addCapture } = useGameHistory();
  const [turnPhase, setTurnPhase] = useState<'select' | 'action' | 'mandatory_move' | 'locked'>('select');
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAdvanceMoves, setValidAdvanceMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });
  const [boardScale, setBoardScale] = useState(0.85);
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';
  const handleTimeout = (winner: 'player1' | 'player2') => {
    setWinner(winner);
    setTurnPhase('locked');
  };

  const handleMouseDown = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked') return;

    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    const pieceId = getPieceAtTile(coordinate);
    if (!pieceId) return;

    const owner = getPieceOwner(pieceId);
    if ((turnPhase === 'select' || turnPhase === 'action') && owner !== currentTurn) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();

    setActivePiece(pieceId);
    setIsDragging(true);

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setInitialDragPos({ x: clientX, y: clientY });

    if (turnPhase === 'select' || turnPhase === 'action') {
      const isFirstMove = !hasMoved[pieceId];
      const { moves, advanceMoves } = getValidMoves(pieceId, coordinate, isFirstMove, gameState as Record<string, string>, pieceMoveCount);
      const attacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'pre-move', isFirstMove);

      setValidMoves(moves);
      setValidAdvanceMoves(advanceMoves);
      setValidAttacks(attacks);
      setTurnPhase('action');
    }
    else if (turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>, pieceMoveCount);
      setValidMoves(allowedMoves);
      setValidAdvanceMoves([]);
      setValidAttacks([]);
    }
  };

  const handleAttackClick = (targetCoord: string) => {
    if (!activePiece || turnPhase === 'locked') return;

    const result = executeAttack(targetCoord, gameState, activePiece);
    if (!result) return;

    setGameState(result.newGameState);
    addCapture(currentTurn, result.capturedPieceId);

    if (result.winner) {
      setWinner(result.winner);
      setTurnPhase('locked');
      return;
    }

    const targetName = PIECE_MOVEMENTS[result.capturedPieceId].name;
    const pieceName = PIECE_MOVEMENTS[activePiece].name;
    addMove({
      player: currentTurn,
      pieceName: `${pieceName} captures ${targetName}`,
      pieceId: activePiece,
      from: gameState[activePiece]!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    });

    const currentPos = gameState[activePiece]!;

    const { attacks, moves } = getMultiCaptureOptions(
      activePiece,
      currentPos,
      result.newGameState as Record<string, string>,
      mandatoryMoveUsed,
      pieceMoveCount
    );

    setValidAttacks(attacks);
    setValidMoves(moves);
    setValidAdvanceMoves([]);

    if (attacks.length > 0 || moves.length > 0) {
      setTurnPhase('mandatory_move');
    } else {
      setTurnPhase('locked');
    }
  };

  const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !activePiece) return;
    setIsDragging(false);

    let clientX, clientY;
    if ('changedTouches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const elementUnderMouse = document.elementFromPoint(clientX, clientY);
    const tile = elementUnderMouse?.closest('[data-tile]');

    if (tile) {
      const targetCoord = tile.getAttribute('data-tile');
      const currentCoord = gameState[activePiece];
      const allMoves = [...validMoves, ...validAdvanceMoves];
      const isAdvance = !!targetCoord && validAdvanceMoves.includes(targetCoord);

      if (targetCoord && allMoves.includes(targetCoord)) {
        setGameState(prev => ({ ...prev, [activePiece]: targetCoord }));
        setHasMoved(prev => ({ ...prev, [activePiece]: true }));
        setPieceMoveCount(prev => ({ ...prev, [activePiece]: (prev[activePiece] || 0) + 1 }));
        setMandatoryMoveUsed(true);

        addMove({
          player: currentTurn,
          pieceName: PIECE_MOVEMENTS[activePiece].name,
          pieceId: activePiece,
          from: currentCoord!,
          to: targetCoord,
          turnNumber: moveHistory.length + 1,
          timestamp: Date.now()
        });

        const wasFirstMove = !hasMoved[activePiece];

        let attacks: string[] = [];
        if (!isAdvance) {
          if (turnPhase === 'action') {
            attacks = getValidAttacks(
              activePiece, targetCoord,
              { ...gameState, [activePiece]: targetCoord } as Record<string, string>,
              'post-move',
              wasFirstMove
            );
          } else if (turnPhase === 'mandatory_move') {
            attacks = getValidAttacks(
              activePiece, targetCoord,
              { ...gameState, [activePiece]: targetCoord } as Record<string, string>,
              'post-move',
              false
            );
          }
        }

        if (attacks.length > 0) {
          setValidMoves([]);
          setValidAdvanceMoves([]);
          setValidAttacks(attacks);
          setTurnPhase('mandatory_move');
        } else {
          setValidMoves([]);
          setValidAdvanceMoves([]);
          setValidAttacks([]);
          setTurnPhase('locked');
        }
      }
    }
  }, [isDragging, activePiece, gameState, validMoves, validAdvanceMoves, turnPhase, currentTurn, hasMoved, pieceMoveCount, moveHistory, addMove]);

  const handleSwitchTurn = () => {
    setCurrentTurn(prev => prev === 'player1' ? 'player2' : 'player1');
    setTurnPhase('select');
    setActivePiece(null);
    setValidMoves([]);
    setValidAdvanceMoves([]);
    setValidAttacks([]);
    setMandatoryMoveUsed(false);
  };

  const togglePerspective = () => {
    setViewMode('locked');
    setPerspective(prev => prev === 'player1' ? 'player2' : 'player1');
  };

  useEffect(() => {
    if (viewMode === 'auto') {
      setPerspective(currentTurn);
    }
  }, [currentTurn, viewMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging && ghostRef.current) {
        if (e.cancelable) e.preventDefault();
        let clientX, clientY;
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }
        ghostRef.current.style.left = `${clientX}px`;
        ghostRef.current.style.top = `${clientY}px`;
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setBoardScale(Math.min((width - 10) / 980, 0.85));
      } else {
        setBoardScale(0.85);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPieceAtTile = (coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
  };

  const getRenderRows = () => {
    const defaultRows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    return perspective === 'player1' ? defaultRows : [...defaultRows].reverse();
  };

  const getRenderCols = () => {
    return perspective === 'player1' ? BOARD_COLUMNS : [...BOARD_COLUMNS].reverse();
  };

  const getRowTiles = (rowNum: number) => {
    let tiles: string[] = [];
    switch (rowNum) {
      case 13: tiles = ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13', 'Q13']; break;
      case 12: tiles = ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12']; break;
      case 11: tiles = ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11', 'Q11']; break;
      case 10: tiles = ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10']; break;
      case 9: tiles = ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9', 'Q9']; break;
      case 8: tiles = ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8']; break;
      case 7: tiles = ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7', 'Q7']; break;
      case 6: tiles = ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6']; break;
      case 5: tiles = ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5', 'Q5']; break;
      case 4: tiles = ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4']; break;
      case 3: tiles = ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3', 'Q3']; break;
      case 2: tiles = ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2']; break;
      case 1: tiles = ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1', 'Q1']; break;
      default: tiles = [];
    }
    return perspective === 'player1' ? tiles : tiles.reverse();
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden">

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">

        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={togglePerspective}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg border border-neutral-600 flex items-center gap-2 transition-all"
          >
            <span className="text-xl">↻</span>
            {perspective === 'player1' ? 'View: P1 (Bottom)' : 'View: P2 (Top)'}
          </button>
          {viewMode === 'locked' && (
            <button onClick={() => setViewMode('auto')} className="text-[10px] text-neutral-400 underline">Reset Auto</button>
          )}
        </div>

        {winner && (
          <div className="absolute top-24 z-50 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-black text-2xl animate-bounce text-center">
            GAME OVER! {winner === 'player1' ? 'BOTTOM' : 'TOP'} WINS!
          </div>
        )}

        {turnPhase === 'mandatory_move' && !winner && (
          <div className="absolute top-24 z-50 bg-yellow-600 text-white px-6 py-2 rounded-full shadow-lg font-bold animate-pulse text-center">
            {validMoves.length > 0 ? "Capture Successful! You MUST move now." : "Capture Successful! Capture again or End Turn."}
          </div>
        )}

        {isDragging && activePiece && activePiece in PIECES && (
          <div
            ref={ghostRef}
            className="fixed pointer-events-none z-100"
            style={{
              left: initialDragPos.x,
              top: initialDragPos.y,
              transform: 'translate(-50%, -50%) scale(0.65) scale(1.15)',
              willChange: 'left, top'
            }}
          >
            <div className={`${circleSize} rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)]`}>
              <img src={PIECES[activePiece]} alt="dragging" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        )}

        <div
          className="origin-center transition-transform duration-500 ease-in-out"
          style={{ transform: `scale(${boardScale})` }}
        >
          <div className="relative bg-[#1a8a3d] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-16 border-[#145c2b] flex flex-col items-center">

            <div className="flex items-center mb-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {getRenderCols().map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>

            <div className="flex flex-col space-y-1">
              {getRenderRows().map((row) => {
                const currentTiles = getRowTiles(row);
                const is9TileRow = currentTiles.length === 9;

                return (
                  <div key={row} className="flex items-center">
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-1`}>{row}</div>

                    <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                      {currentTiles.map((coordinate, i) => {
                        const pieceId = getPieceAtTile(coordinate);
                        const isMyPiece = pieceId && getPieceOwner(pieceId) === currentTurn;
                        const isMoveTarget = validMoves.includes(coordinate);
                        const isAdvanceTarget = validAdvanceMoves.includes(coordinate);
                        const isAttackTarget = validAttacks.includes(coordinate);
                        const canInteract = !winner && (isMyPiece || isAttackTarget || isMoveTarget || isAdvanceTarget);

                        return (
                          <div
                            key={`${row}-${i}`}
                            data-tile={coordinate}
                            onMouseDown={(e) => isAttackTarget ? handleAttackClick(coordinate) : handleMouseDown(coordinate, e)}
                            onTouchStart={(e) => isAttackTarget ? handleAttackClick(coordinate) : handleMouseDown(coordinate, e)}
                            className={`
                              group relative ${circleSize} 
                              bg-linear-to-br from-white to-gray-200 
                              rounded-full 
                              shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                              ${canInteract ? 'cursor-pointer hover:scale-105' : ''}
                              border border-gray-300 
                              shrink-0 flex items-center justify-center
                              z-10
                            `}
                          >
                            {pieceId && pieceId in PIECES && (
                              <img
                                src={PIECES[pieceId as PieceKey]}
                                alt="piece"
                                className={`
                                  w-full h-full rounded-full object-cover 
                                  ${(isDragging && pieceId === activePiece) ? 'opacity-30 grayscale' : ''}
                                  pointer-events-none select-none
                                `}
                              />
                            )}
                            {isMoveTarget && !pieceId && (
                              <div className="absolute w-6 h-6 bg-green-500 rounded-full animate-pulse z-20 shadow-[0_0_15px_rgba(74,222,128,1)]" />
                            )}
                            {isAdvanceTarget && !pieceId && (
                              <div className="absolute w-6 h-6 bg-yellow-400 rounded-full animate-pulse z-20 shadow-[0_0_15px_rgba(250,204,21,1)]" />
                            )}
                            {isAttackTarget && (
                              <div className="absolute w-full h-full rounded-full border-4 border-red-600 animate-pulse z-30 shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-50">
                                  <div className="absolute w-full h-1 bg-red-600 top-1/2 -translate-y-1/2"></div>
                                  <div className="absolute h-full w-1 bg-red-600 left-1/2 -translate-x-1/2"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-start pl-1`}>{row}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center mt-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {getRenderCols().map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>
          </div>
        </div>
      </div>

      <MoveHistory
        moves={moveHistory}
        currentTurn={currentTurn}
        onSwitchTurn={handleSwitchTurn}
        canSwitchTurn={turnPhase === 'locked'}
        capturedByP1={capturedByP1}
        capturedByP2={capturedByP2}
        onTimeout={handleTimeout}
        initialTime={timeLimit}
      />

    </div>
  );
};

export default Board;