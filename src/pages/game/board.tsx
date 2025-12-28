import React, { useState, useEffect } from 'react';
import { 
  PIECES, 
  PieceKey, 
  getValidMoves, 
  PLAYER_1_PIECES, 
  PLAYER_2_PIECES 
} from './mechanics/piecemovements';
import { INITIAL_POSITIONS } from './mechanics/positions';

const Board: React.FC = () => {
const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  const rows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const circleSize = "w-17 h-17"; 
  const rowHeight = "h-12";       
  const gridWidth = 'w-[900px]';  
  const sideWidth = 'w-16';       

  const getPieceAtTile = (coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(
      (key) => gameState[key] === coordinate
    );
  };
  const isPieceOwner = (pieceId: PieceKey): boolean => {
    if (currentTurn === 'player1') return PLAYER_1_PIECES.has(pieceId);
    if (currentTurn === 'player2') return PLAYER_2_PIECES.has(pieceId);
    return false;
  };
  const handleMouseDown = (coordinate: string, e: React.MouseEvent) => {
    const pieceId = getPieceAtTile(coordinate);
    if (!pieceId) return;
    if (!isPieceOwner(pieceId)) {
        console.log("Not your turn!");
        return;
    }

    e.preventDefault();
    setActivePiece(pieceId);
    setIsDragging(true);
    setMousePos({ x: e.clientX, y: e.clientY });
    
    const moves = getValidMoves(
      pieceId, 
      coordinate, 
      !hasMoved[pieceId], 
      gameState
    );
    setValidMoves(moves);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !activePiece) return;

      setIsDragging(false);
      
      const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
      const tile = elementUnderMouse?.closest('[data-tile]');
      
      if (tile) {
        const targetCoordinate = tile.getAttribute('data-tile');
        if (targetCoordinate && validMoves.includes(targetCoordinate)) {
            setGameState((prev) => ({ ...prev, [activePiece]: targetCoordinate }));
            setHasMoved((prev) => ({ ...prev, [activePiece]: true }));
            setCurrentTurn((prev) => prev === 'player1' ? 'player2' : 'player1');
        }
      }
      
      setActivePiece(null);
      setValidMoves([]); 
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activePiece, validMoves]); 

  const getRowTiles = (rowNum: number) => {
    switch (rowNum) {
      case 13: return ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13', 'Q13'];
      case 12: return ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12'];
      case 11: return ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11', 'Q11'];
      case 10: return ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10'];
      case 9:  return ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9', 'Q9'];
      case 8:  return ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8'];
      case 7:  return ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7', 'Q7'];
      case 6:  return ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6'];
      case 5:  return ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5', 'Q5'];
      case 4:  return ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4'];
      case 3:  return ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3', 'Q3'];
      case 2:  return ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2'];
      case 1:  return ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1', 'Q1'];
      default: return [];
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-neutral-800 overflow-hidden relative">
      {isDragging && activePiece && (
        <div 
          className="fixed pointer-events-none z-[100]"
          style={{ 
            left: mousePos.x, top: mousePos.y,
            transform: 'translate(-50%, -50%) scale(0.65) scale(1.15)' 
          }}
        >
          <div className={`${circleSize} rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)]`}>
            <img src={PIECES[activePiece]} alt="dragging" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      )}
      
      <div className="transform scale-[0.65] origin-center mt-12">
        <div className="relative bg-[#1a8a3d] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[16px] border-[#145c2b] flex flex-col items-center">
          <div className="flex items-center mb-4 w-full justify-center">
            <div className={`${sideWidth}`}></div>
            <div className={`flex justify-between ${gridWidth} px-10`}> 
              {columns.map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
            </div>
            <div className={`${sideWidth}`}></div>
          </div>
          
          <div className="flex flex-col space-y-1"> 
            {rows.map((row) => {
              const currentTiles = getRowTiles(row);
              const is9TileRow = currentTiles.length === 9;

              return (
                <div key={row} className="flex items-center">
                  <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-6`}>{row}</div>

                  <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                    {currentTiles.map((coordinate, i) => {
                      const pieceId = getPieceAtTile(coordinate);
                      const isBeingDragged = pieceId === activePiece;
                      const isValidTarget = validMoves.includes(coordinate);
                      
                      // Visual Feedback Logic
                      const isMyPiece = pieceId && isPieceOwner(pieceId);
                      const isClickable = !isDragging && isMyPiece;

                      return (
                        <div
                          key={`${row}-${i}`}
                          data-tile={coordinate}
                          onMouseDown={(e) => handleMouseDown(coordinate, e)}
                          className={`
                            group relative ${circleSize} 
                            bg-gradient-to-br from-white to-gray-200 
                            rounded-full 
                            shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                            ${isClickable ? 'hover:scale-105 cursor-pointer ring-4 ring-offset-2 ring-transparent hover:ring-green-400' : ''} 
                            ${!isClickable && pieceId ? 'cursor-not-allowed opacity-90' : ''}
                            transition-all duration-150 ease-out
                            border border-gray-300 
                            flex-shrink-0 flex items-center justify-center
                            z-10
                          `}
                        >
                          {pieceId && (
                            <img 
                              src={PIECES[pieceId]} 
                              alt="piece" 
                              className={`
                                w-full h-full rounded-full object-cover 
                                ${isBeingDragged ? 'opacity-30 grayscale' : ''}
                                ${isClickable ? 'active:cursor-grabbing' : ''}
                              `} 
                            />
                          )}
                          {isValidTarget && !pieceId && (
                            <div className="absolute w-6 h-6 bg-green-500 rounded-full animate-pulse z-20 shadow-[0_0_15px_rgba(74,222,128,1)]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-start pl-6`}>{row}</div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center mt-4 w-full justify-center">
            <div className={`${sideWidth}`}></div>
            <div className={`flex justify-between ${gridWidth} px-10`}>
              {columns.map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
            </div>
            <div className={`${sideWidth}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;