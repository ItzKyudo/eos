import React from 'react';
import Sidebar from '../../components/sidebar';
import RightPanel from '../../components/RightPanel';
import { PIECES } from './mechanics/piecemovements';
import { INITIAL_POSITIONS } from './mechanics/positions';
import { useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import { BOARD_COLUMNS } from './utils/gameUtils';
const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const { incomingChallenge, acceptChallenge, declineChallenge } = useFriendsStatus();

  // Listen for matchFound event from hook
  React.useEffect(() => {
    const handleMatchFound = (e: any) => {
      const matchData = e.detail;
      console.log("Navigating to game:", matchData);
      navigate('/game', { state: matchData });
    };
    window.addEventListener('matchFound', handleMatchFound);
    return () => window.removeEventListener('matchFound', handleMatchFound);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col lg:flex-row h-screen overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center bg-[#0f172a] p-4 lg:p-0 overflow-hidden relative z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />



          <div className="transform scale-[0.35] sm:scale-[0.45] md:scale-[0.55] lg:scale-[0.60] xl:scale-[0.70] origin-center shadow-2xl transition-transform duration-500">
            <BoardPreview />
          </div>
        </div>
        <RightPanel />

        {/* Challenge Invite Overlay */}
        {incomingChallenge && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
            <div className="bg-[#1e293b] p-4 rounded-xl shadow-2xl border border-blue-500/50 flex items-center gap-6 min-w-[320px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl">
                  {incomingChallenge.challengerName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Challenge from {incomingChallenge.challengerName}</h3>
                  <p className="text-xs text-blue-300">Time Control: {incomingChallenge.timeControl / 60} mins</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => declineChallenge(incomingChallenge.challengerId)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 font-bold text-xs"
                >
                  Decline
                </button>
                <button
                  onClick={() => acceptChallenge(incomingChallenge.challengerId, incomingChallenge.timeControl)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-xs shadow-lg transition-all"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
const BoardPreview: React.FC = () => {
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';

  const renderRows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

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
    return tiles;
  };

  const getPieceAtTile = (coordinate: string) => {
    return (Object.keys(INITIAL_POSITIONS) as Array<keyof typeof INITIAL_POSITIONS>).find(key => INITIAL_POSITIONS[key] === coordinate);
  };

  return (
    <div className="relative bg-[#1e293b] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[16px] border-[#09357A] flex flex-col items-center select-none pointer-events-none">
      <div className="flex items-center mb-4 w-full justify-center">
        <div className={`${sideWidth}`}></div>
        <div className={`flex justify-between ${gridWidth} px-10`}>
          {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
        </div>
        <div className={`${sideWidth}`}></div>
      </div>

      <div className="flex flex-col space-y-1">
        {renderRows.map((row) => {
          const currentTiles = getRowTiles(row);
          const is9TileRow = currentTiles.length === 9;

          return (
            <div key={row} className="flex items-center">
              <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-end pr-6`}>{row}</div>

              <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                {currentTiles.map((coordinate, i) => {
                  const pieceId = getPieceAtTile(coordinate);
                  return (
                    <div
                      key={`${row}-${i}`}
                      className={`
                              relative ${circleSize} 
                              bg-linear-to-br from-gray-100 to-gray-300
                              rounded-full 
                              shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                              border border-gray-400 
                              shrink-0 flex items-center justify-center
                            `}
                    >
                      {pieceId && (
                        <img src={PIECES[pieceId]} alt="piece" className="w-full h-full rounded-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-start pl-6`}>{row}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center mt-4 w-full justify-center">
        <div className={`${sideWidth}`}></div>
        <div className={`flex justify-between ${gridWidth} px-10`}>
          {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
        </div>
        <div className={`${sideWidth}`}></div>
      </div>
    </div>
  );
}

export default GameSetup;