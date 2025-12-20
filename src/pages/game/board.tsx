import React from 'react';
import logoImg from '../../images/logo.png';

const Board: React.FC = () => {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
  const rows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const circleSize = "w-14 h-14"; 
  const rowHeight = "h-12"; 
  const gridWidth = 'w-[800px]'; 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2">
      <div className="relative bg-[#1a8a3d] p-4 rounded-lg shadow-2xl flex flex-col items-center">
        
        {/* Top Letters (A-O) */}
        <div className={`flex justify-between ${gridWidth} px-6 mb-1`}>
          {columns.map((col) => (
            <div key={col} className="text-white text-center font-bold text-xl w-14">
              {col}
            </div>
          ))}
        </div>

        <div className="flex items-center">
          {/* Left Numbers */}
          <div className="flex flex-col pr-2">
            {rows.map((row) => (
              <div key={row} className={`text-white font-bold text-xl ${rowHeight} flex items-center justify-end`}>
                {row}
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div className={`flex flex-col ${gridWidth}`}>
            {rows.map((row, rowIndex) => {
              const is9TileRow = rowIndex % 2 === 0;
              const tileCount = is9TileRow ? 9 : 8;
              
              return (
                <div 
                  key={row} 
                  className={`flex ${rowHeight} items-center justify-around w-full ${!is9TileRow ? 'px-16' : 'px-4'}`}
                >
                  {Array.from({ length: tileCount }).map((_, i) => {
                    /**
                     * Coordinate Logic:
                     * For 9-tile rows: Spaced out across A-O
                     * For 8-tile rows: Spaced out in between
                     * Using a simplified mapping for the display coordinate
                     */
                    const colLetter = columns[Math.floor(i * (columns.length / tileCount))];
                    const coordinate = `${colLetter}${row}`;

                    return (
                      <div
                        key={`${row}-${i}`}
                        className={`group relative ${circleSize} bg-white rounded-full shadow-inner hover:bg-gray-200 transition-all cursor-pointer border-2 border-gray-200 flex-shrink-0 flex items-center justify-center`}
                      >
                        {/* Hover Coordinate Label */}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1a8a3d] font-black text-sm pointer-events-none select-none">
                          {coordinate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Right Numbers */}
          <div className="flex flex-col pl-2">
            {rows.map((row) => (
              <div key={row} className={`text-white font-bold text-xl ${rowHeight} flex items-center`}>
                {row}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Letters */}
        <div className={`flex justify-between ${gridWidth} px-6 mt-1`}>
          {columns.map((col) => (
            <div key={col} className="text-white text-center font-bold text-xl w-14">
              {col}
            </div>
          ))}
        </div>

        <CornerLogo position="top-left" />
        <CornerLogo position="top-right" />
        <CornerLogo position="bottom-left" />
        <CornerLogo position="bottom-right" />
      </div>
    </div>
  );
};

const CornerLogo = ({ position }: { position: string }) => {
  const posClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
  }[position];

  return (
    <div className={`absolute ${posClasses} w-16 h-16 opacity-90`}>
      <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
    </div>
  );
};

export default Board;