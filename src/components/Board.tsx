import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PIECES, PieceKey, getPieceOwner } from '../pages/game/mechanics/piecemovements';
import { getRenderRows, getRenderCols, getRowTiles, getPieceAtTile, parseCoord } from '../pages/game/utils/gameUtils';
import { PlayerRole, TurnPhase, Winner } from '../types/gameTypes';

interface BoardProps {
  gameState: Partial<Record<PieceKey, string>>;
  perspective: PlayerRole;
  turnPhase: TurnPhase;
  currentTurn: PlayerRole;
  winner: Winner;
  validMoves: string[];
  validAttacks: string[];
  activePiece: PieceKey | null;
  onTileClick: (coord: string, e: React.MouseEvent | React.TouchEvent) => void;
  onPieceDrop: (pieceId: PieceKey, targetCoord: string) => void;
  onAttackClick: (coord: string) => void;
}

const Board: React.FC<BoardProps> = ({
  gameState, perspective, turnPhase, currentTurn, winner,
  validMoves, validAttacks, activePiece,
  onTileClick, onPieceDrop, onAttackClick
}) => {
  // Styles
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(0.85);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setBoardScale(Math.max(0.3, Math.min((width - 10) / 980, 0.85)));
      } else {
        setBoardScale(0.85);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, pieceId?: PieceKey) => {
    if (!pieceId || winner || turnPhase === 'locked') return;
    if (getPieceOwner(pieceId) !== perspective) return; 

    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragPos({ x: clientX, y: clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDragging && ghostRef.current) {
      if (e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      ghostRef.current.style.left = `${clientX}px`;
      ghostRef.current.style.top = `${clientY}px`;
    }
  }, [isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !activePiece) return;
    setIsDragging(false);

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;
    const element = document.elementFromPoint(clientX, clientY);
    const tile = element?.closest('[data-tile]');
    
    if (tile) {
      const targetCoord = tile.getAttribute('data-tile');
      if (targetCoord && validMoves.includes(targetCoord)) {
        onPieceDrop(activePiece, targetCoord);
      }
    }
  }, [isDragging, activePiece, validMoves, onPieceDrop]);

  useEffect(() => {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
      
      {/* Ghost Drag Image */}
      {isDragging && activePiece && (
        <div ref={ghostRef} className="fixed pointer-events-none z-100" style={{ left: dragPos.x, top: dragPos.y, transform: 'translate(-50%, -50%) scale(1.15)' }}>
          <div className="w-17 h-17 rounded-full shadow-2xl">
            <img src={PIECES[activePiece]} alt="dragging" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      )}

      {/* Board Rendering */}
      <div className="origin-center transition-transform duration-500 ease-in-out" style={{ transform: `scale(${boardScale})` }}>
        <div className="relative bg-[#1a8a3d] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-16 border-[#145c2b] flex flex-col items-center">
          
          {/* Top Coordinates */}
          <div className="flex items-center mb-4 w-full justify-center">
            <div className={sideWidth}></div>
            <div className={`flex justify-between ${gridWidth} px-10`}>
              {getRenderCols(perspective).map(col => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
            </div>
            <div className={sideWidth}></div>
          </div>

          {/* Grid */}
          <div className="flex flex-col space-y-1">
            {getRenderRows(perspective).map((row) => {
              const currentTiles = getRowTiles(row, perspective);
              const is9TileRow = currentTiles.length === 9;

              return (
                <div key={row} className="flex items-center">
                  <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-1`}>{row}</div>
                  <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                    {currentTiles.map((coordinate, i) => {
                      const pieceId = getPieceAtTile(gameState, coordinate);
                      const isMoveTarget = validMoves.includes(coordinate);
                      const isAttackTarget = validAttacks.includes(coordinate);
                      const canInteract = !winner && ((pieceId && getPieceOwner(pieceId) === currentTurn) || isAttackTarget);
                      
                      // --- Advance Move Logic (Color Calculation) ---
                      let isAdvanceMove = false;
                      if (isMoveTarget && activePiece && gameState[activePiece]) {
                         const start = parseCoord(gameState[activePiece]!);
                         const end = parseCoord(coordinate);
                         const dist = Math.abs(end.rowNum - start.rowNum);
                         if (dist === 3) isAdvanceMove = true;
                      }

                      return (
                        <div
                          key={`${row}-${i}`}
                          data-tile={coordinate}
                          onMouseDown={(e) => {
                            if (isAttackTarget) onAttackClick(coordinate);
                            else {
                                onTileClick(coordinate, e);
                                if (pieceId) handleMouseDown(e, pieceId);
                            }
                          }}
                          onTouchStart={(e) => {
                             if (isAttackTarget) onAttackClick(coordinate);
                             else {
                                onTileClick(coordinate, e);
                                if (pieceId) handleMouseDown(e, pieceId);
                             }
                          }}
                          className={`
                            group relative ${circleSize} 
                            bg-linear-to-br from-white to-gray-200 
                            rounded-full 
                            shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                            ${canInteract ? 'cursor-pointer hover:scale-105' : ''}
                            border border-gray-300 shrink-0 flex items-center justify-center
                            ${pieceId ? 'z-30' : ''}
                          `}
                        >
                          {pieceId && (
                            <motion.div
                              layoutId={pieceId}
                              transition={{ type: "spring", stiffness: 280, damping: 25 }}
                              className="w-full h-full p-[2px] pointer-events-none z-50 relative"
                            >
                              <img
                                src={PIECES[pieceId]}
                                alt="piece"
                                className={`w-full h-full rounded-full object-cover ${(isDragging && pieceId === activePiece) ? 'opacity-0' : ''} select-none shadow-md`}
                              />
                            </motion.div>
                          )}
                          {isMoveTarget && !pieceId && (
                            <div className={`
                              absolute rounded-full animate-pulse z-20 
                              ${isAdvanceMove 
                                 ? 'w-4 h-4 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]' 
                                 : 'w-4 h-4 bg-green-500 shadow-[0_0_15px_rgba(74,222,128,1)]' 
                              }
                            `} />
                          )}
                          
                          {/* Attack Indicator Ring */}
                          {isAttackTarget && (
                            <div className="absolute w-full h-full rounded-full border-4 border-red-600 animate-pulse z-30 shadow-[0_0_20px_rgba(220,38,38,0.6)]" />
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

          {/* Bottom Coordinates */}
          <div className="flex items-center mt-4 w-full justify-center">
             <div className={sideWidth}></div>
             <div className={`flex justify-between ${gridWidth} px-10`}>
               {getRenderCols(perspective).map(col => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
             </div>
             <div className={sideWidth}></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Board;