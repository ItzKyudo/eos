import React, { useRef } from 'react';
import { PIECES, PieceKey, getPieceOwner } from '../mechanics/piecemovements';
import { BOARD_COLUMNS } from '../utils/gameUtils';

type Winner = 'player1' | 'player2' | 'draw' | null;

interface SharedGameBoardProps {
  gameState: Partial<Record<PieceKey, string>>;
  hasMoved: Record<string, boolean>;
  currentTurn: 'player1' | 'player2';
  turnPhase: 'select' | 'action' | 'mandatory_move' | 'locked';
  activePiece: PieceKey | null;
  validMoves: string[];
  validAttacks: string[];
  perspective: 'player1' | 'player2';
  boardScale: number;
  winner: Winner;
  onPieceSelect: (coordinate: string, e: React.MouseEvent | React.TouchEvent) => void;
  onAttackClick: (targetCoord: string) => void;
  onDragStart: (coordinate: string, e: React.MouseEvent | React.TouchEvent) => void;
  isMultiplayer?: boolean;
  myRole?: 'player1' | 'player2';
  isDragging?: boolean;
  initialDragPos?: { x: number; y: number };
}

const SharedGameBoard: React.FC<SharedGameBoardProps> = ({
  gameState,
  currentTurn,
  activePiece,
  validMoves,
  validAttacks,
  perspective,
  boardScale,
  winner,
  onAttackClick,
  onDragStart,
  isMultiplayer = false,
  myRole,
  isDragging = false,
  initialDragPos = { x: 0, y: 0 }
}) => {
  const ghostRef = useRef<HTMLDivElement>(null);

  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';

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

  const canInteractWithPiece = (pieceId: PieceKey | undefined, coordinate: string) => {
    if (winner || !pieceId) return false;
    
    if (isMultiplayer && myRole !== currentTurn) return false;
    
    const isMyPiece = getPieceOwner(pieceId) === currentTurn;
    const isAttackTarget = validAttacks.includes(coordinate);
    
    return isMyPiece || isAttackTarget;
  };

  return (
    <>
      {isDragging && activePiece && (
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
          {/* Top Column Labels */}
          <div className="flex items-center mb-4 w-full justify-center">
            <div className={`${sideWidth}`}></div>
            <div className={`flex justify-between ${gridWidth} px-10`}>
              {getRenderCols().map((col) => (
                <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>
              ))}
            </div>
            <div className={`${sideWidth}`}></div>
          </div>

          {/* Board Rows */}
          <div className="flex flex-col space-y-1">
            {getRenderRows().map((row) => {
              const currentTiles = getRowTiles(row);
              const is9TileRow = currentTiles.length === 9;

              return (
                <div key={row} className="flex items-center">
                  {/* Left Row Number */}
                  <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-1`}>
                    {row}
                  </div>

                  {/* Tiles */}
                  <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                    {currentTiles.map((coordinate, i) => {
                      const pieceId = getPieceAtTile(coordinate);
                      const canInteract = canInteractWithPiece(pieceId, coordinate);
                      const isMoveTarget = validMoves.includes(coordinate);
                      const isAttackTarget = validAttacks.includes(coordinate);

                      return (
                        <div
                          key={`${row}-${i}`}
                          data-tile={coordinate}
                          onMouseDown={(e) => isAttackTarget ? onAttackClick(coordinate) : (canInteract ? onDragStart(coordinate, e) : undefined)}
                          onTouchStart={(e) => isAttackTarget ? onAttackClick(coordinate) : (canInteract ? onDragStart(coordinate, e) : undefined)}
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
                          {pieceId && (
                            <img
                              src={PIECES[pieceId]}
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

                  {/* Right Row Number */}
                  <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-start pl-1`}>
                    {row}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Column Labels */}
          <div className="flex items-center mt-4 w-full justify-center">
            <div className={`${sideWidth}`}></div>
            <div className={`flex justify-between ${gridWidth} px-10`}>
              {getRenderCols().map((col) => (
                <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>
              ))}
            </div>
            <div className={`${sideWidth}`}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SharedGameBoard;