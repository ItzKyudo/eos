import React, { useEffect, useRef, useState } from 'react';
import { PIECES, PieceKey } from './piecemovements';

export interface MoveLog {
  player: 'player1' | 'player2';
  pieceName: string;
  pieceId?: PieceKey;
  from: string;
  to: string;
  turnNumber: number;
  timestamp?: number;
}

interface MoveHistoryProps {
  moves: MoveLog[];
  currentTurn: 'player1' | 'player2';
  onSwitchTurn: () => void;
  canSwitchTurn: boolean;
  capturedByP1: PieceKey[];
  capturedByP2: PieceKey[];
}

// --- HOOK: useGameHistory ---
// Handles Move Log and Captured Pieces State
export const useGameHistory = () => {
  const [moveHistory, setMoveHistory] = useState<MoveLog[]>([]);
  const [capturedByP1, setCapturedByP1] = useState<PieceKey[]>([]);
  const [capturedByP2, setCapturedByP2] = useState<PieceKey[]>([]);

  const addMove = (move: MoveLog) => {
    setMoveHistory(prev => [...prev, move]);
  };

  const addCapture = (player: 'player1' | 'player2', pieceId: PieceKey) => {
    if (player === 'player1') {
      setCapturedByP1(prev => [...prev, pieceId]);
    } else {
      setCapturedByP2(prev => [...prev, pieceId]);
    }
  };

  const clearHistory = () => {
    setMoveHistory([]);
    setCapturedByP1([]);
    setCapturedByP2([]);
  };

  return {
    moveHistory,
    capturedByP1,
    capturedByP2,
    addMove,
    addCapture,
    clearHistory
  };
};


const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const MoveHistory: React.FC<MoveHistoryProps> = ({ 
  moves, 
  currentTurn, 
  onSwitchTurn, 
  canSwitchTurn,
  capturedByP1,
  capturedByP2 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [p1Time, setP1Time] = useState(600);
  const [p2Time, setP2Time] = useState(600);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  useEffect(() => {
    if (moves.length === 0) return;

    const timer = setInterval(() => {
      if (currentTurn === 'player1') {
        setP1Time((t) => Math.max(0, t - 1));
      } else {
        setP2Time((t) => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, moves.length]);

  const handleClockClick = () => {
    if (canSwitchTurn) {
      onSwitchTurn();
    }
  };

  const getButtonStyle = (player: 'player1' | 'player2') => {
    const isMyTurn = currentTurn === player;
    if (!isMyTurn) {
      return 'bg-neutral-700 opacity-50 cursor-not-allowed border-2 border-transparent';
    }
    if (!canSwitchTurn) {
      return 'bg-neutral-700 border-2 border-yellow-600/50 cursor-not-allowed opacity-90';
    }
    if (player === 'player1') {
      return 'bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105 border-2 border-green-400 cursor-pointer hover:bg-green-500';
    } else {
      return 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105 border-2 border-blue-400 cursor-pointer hover:bg-blue-500';
    }
  };

  return (
    <div className="w-96 h-180 bg-neutral-900 border-l-4 border-neutral-700 flex flex-col shadow-2xl overflow-hidden font-sans">
      
      {/* --- CLOCK & CAPTURES --- */}
      <div className="bg-neutral-800 p-4 border-b border-neutral-700 shadow-lg z-10">
        <div className="flex justify-between gap-4 mb-4">
          
          {/* PLAYER 1 */}
          <div className="flex-1 flex flex-col gap-2">
            <button 
              onClick={() => currentTurn === 'player1' && handleClockClick()}
              disabled={currentTurn !== 'player1' || !canSwitchTurn}
              className={`w-full py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform ${getButtonStyle('player1')}`}
            >
              <span className="text-green-100 text-xs font-bold uppercase tracking-widest mb-1">Player 1</span>
              <span className="text-3xl font-mono font-black text-white tracking-widest">{formatTime(p1Time)}</span>
              {currentTurn === 'player1' && canSwitchTurn && <span className="text-[10px] text-green-200 mt-1 animate-pulse font-bold">END TURN</span>}
            </button>
            <div className="min-h-[24px] bg-neutral-900/50 rounded-lg p-1 flex flex-wrap gap-1 justify-center">
              {capturedByP1.map((p, i) => <img key={i} src={PIECES[p]} alt="captured" className="w-5 h-5 opacity-80" />)}
            </div>
          </div>

          {/* PLAYER 2 */}
          <div className="flex-1 flex flex-col gap-2">
            <button 
              onClick={() => currentTurn === 'player2' && handleClockClick()}
              disabled={currentTurn !== 'player2' || !canSwitchTurn}
              className={`w-full py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform ${getButtonStyle('player2')}`}
            >
              <span className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Player 2</span>
              <span className="text-3xl font-mono font-black text-white tracking-widest">{formatTime(p2Time)}</span>
              {currentTurn === 'player2' && canSwitchTurn && <span className="text-[10px] text-blue-200 mt-1 animate-pulse font-bold">END TURN</span>}
            </button>
            <div className="min-h-[24px] bg-neutral-900/50 rounded-lg p-1 flex flex-wrap gap-1 justify-center">
              {capturedByP2.map((p, i) => <img key={i} src={PIECES[p]} alt="captured" className="w-5 h-5 opacity-80" />)}
            </div>
          </div>

        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="px-4 py-2 bg-neutral-800/50 flex justify-between items-center border-b border-neutral-700">
         <h2 className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Battle Log</h2>
         <span className="bg-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5 rounded-full">{moves.length} MOVES</span>
      </div>

      {/* --- MOVE LIST --- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
        {moves.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <p className="text-neutral-400 font-mono text-sm">Waiting for start...</p>
          </div>
        )}
        {moves.map((move, index) => (
          <div key={index} className={`relative pl-3 py-3 pr-4 rounded-r-lg border-l-4 shadow-sm transition-all hover:bg-neutral-800 ${move.player === 'player1' ? 'border-green-500 bg-linear-to-r from-green-900/10 to-transparent' : 'border-blue-500 bg-linear-to-r from-blue-900/10 to-transparent'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-inner overflow-hidden ${move.player === 'player1' ? 'bg-green-900/30' : 'bg-blue-900/30'}`}>
                    {move.pieceId ? <img src={PIECES[move.pieceId]} alt="piece" className="w-full h-full object-cover transform scale-110" /> : <span className="text-xs font-bold text-neutral-500">?</span>}
                 </div>
                 <div className="flex flex-col">
                    <span className={`text-xs font-black uppercase tracking-wider ${move.player === 'player1' ? 'text-green-400' : 'text-blue-400'}`}>{move.pieceName}</span>
                    <span className="text-neutral-300 text-sm font-mono flex items-center gap-2 mt-0.5">
                      <span className="opacity-50">{move.from}</span>
                      <span>➜</span>
                      <span className="font-bold">{move.to}</span>
                    </span>
                 </div>
              </div>
              <div className="text-[10px] text-neutral-600 font-mono border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 rounded">#{move.turnNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;