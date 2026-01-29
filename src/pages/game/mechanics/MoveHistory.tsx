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
  onTimeout: (winner: 'player1' | 'player2') => void;
  initialTime: number; 
}

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

  return {
    moveHistory,
    capturedByP1,
    capturedByP2,
    addMove,
    addCapture
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
  capturedByP2,
  onTimeout,
  initialTime
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [p1Time, setP1Time] = useState(initialTime); 
  const [p2Time, setP2Time] = useState(initialTime);

  const isInfiniteTime = initialTime === 0;
  useEffect(() => {
    setP1Time(initialTime);
    setP2Time(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);
  useEffect(() => {
    //timer lugic
    if (isInfiniteTime || moves.length === 0) return;
    const timer = setInterval(() => {
      if (currentTurn === 'player1') {
        setP1Time((t) => {
          if (t <= 1) {
            clearInterval(timer);
            onTimeout('player2'); 
            return 0;
          }
          return t - 1;
        });
      } else {
        setP2Time((t) => {
          if (t <= 1) {
            clearInterval(timer);
            onTimeout('player1'); 
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, moves.length, onTimeout, isInfiniteTime]);

  const handleClockClick = () => {
    if (canSwitchTurn) {
      onSwitchTurn();
    }
  };

  const getButtonStyle = (player: 'player1' | 'player2') => {
    const isMyTurn = currentTurn === player;
    if (!isMyTurn) return 'bg-neutral-700 opacity-50 cursor-not-allowed border border-transparent';
    if (!canSwitchTurn) return 'bg-neutral-700 border border-yellow-600/50 cursor-not-allowed opacity-90';
    
    if (player === 'player1') {
      return 'bg-green-700 shadow-[0_0_10px_rgba(34,197,94,0.3)] border border-green-500 cursor-pointer hover:bg-green-600';
    } else {
      return 'bg-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] border border-blue-500 cursor-pointer hover:bg-blue-600';
    }
  };

  return (
    <div className="w-full lg:w-72 h-[25vh] lg:h-auto bg-neutral-900 border-t-2 lg:border-t-0 lg:border-l-2 border-neutral-700 flex flex-col shadow-2xl overflow-hidden font-sans z-20">
      <div className="bg-neutral-800 p-2 border-b border-neutral-700 shadow-md shrink-0">
        <div className="flex justify-between gap-2">
          
          {/* PLAYER 1 */}
          <div className="flex-1 flex flex-col gap-1">
            <button 
              onClick={() => currentTurn === 'player1' && handleClockClick()}
              disabled={currentTurn !== 'player1' || !canSwitchTurn}
              className={`w-full py-1.5 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${getButtonStyle('player1')}`}
            >
              <span className="text-green-100 text-[9px] font-bold uppercase tracking-wider">P1</span>
              <span className="text-lg lg:text-xl font-mono font-bold text-white leading-none">
                {isInfiniteTime ? '∞' : formatTime(p1Time)}
              </span>
              {currentTurn === 'player1' && canSwitchTurn && <span className="text-[8px] text-green-200 animate-pulse font-bold">END</span>}
            </button>
            <div className="min-h-[16px] bg-neutral-900/50 rounded p-0.5 flex flex-wrap gap-0.5 justify-center">
              {capturedByP1.map((p, i) => (p in PIECES ? <img key={i} src={PIECES[p]} alt="captured" className="w-3 h-3 opacity-70" /> : null))}
            </div>
          </div>

          {/* PLAYER 2 */}
          <div className="flex-1 flex flex-col gap-1">
            <button 
              onClick={() => currentTurn === 'player2' && handleClockClick()}
              disabled={currentTurn !== 'player2' || !canSwitchTurn}
              className={`w-full py-1.5 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${getButtonStyle('player2')}`}
            >
              <span className="text-blue-100 text-[9px] font-bold uppercase tracking-wider">P2</span>
              <span className="text-lg lg:text-xl font-mono font-bold text-white leading-none">
                {isInfiniteTime ? '∞' : formatTime(p2Time)}
              </span>
              {currentTurn === 'player2' && canSwitchTurn && <span className="text-[8px] text-blue-200 animate-pulse font-bold">END</span>}
            </button>
            <div className="min-h-[16px] bg-neutral-900/50 rounded p-0.5 flex flex-wrap gap-0.5 justify-center">
              {capturedByP2.map((p, i) => (p in PIECES ? <img key={i} src={PIECES[p]} alt="captured" className="w-3 h-3 opacity-70" /> : null))}
            </div>
          </div>

        </div>
      </div>
      <div className="px-3 py-1 bg-neutral-800/50 flex justify-between items-center border-b border-neutral-700 shrink-0">
         <h2 className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">History</h2>
         <span className="bg-neutral-800 text-neutral-400 text-[9px] px-1.5 rounded-full">{moves.length}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
        {moves.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <p className="text-neutral-400 font-mono text-[10px]">Ready</p>
          </div>
        )}
        {moves.map((move, index) => (
          <div key={index} className={`relative pl-2 py-1.5 pr-2 rounded-r border-l-2 shadow-sm transition-all hover:bg-neutral-800 ${move.player === 'player1' ? 'border-green-600 bg-linear-to-r from-green-900/10 to-transparent' : 'border-blue-600 bg-linear-to-r from-blue-900/10 to-transparent'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className={`w-6 h-6 rounded flex items-center justify-center shadow-inner overflow-hidden ${move.player === 'player1' ? 'bg-green-900/30' : 'bg-blue-900/30'}`}>
                    {move.pieceId && move.pieceId in PIECES ? <img src={PIECES[move.pieceId]} alt="piece" className="w-full h-full object-cover transform scale-110" /> : <span className="text-[9px] font-bold text-neutral-500">?</span>}
                 </div>
                 <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase ${move.player === 'player1' ? 'text-green-400' : 'text-blue-400'}`}>{move.pieceName}</span>
                    <span className="text-neutral-400 text-[9px] font-mono flex items-center gap-1 leading-none">
                      <span className="opacity-60">{move.from}</span>
                      <span className="text-[8px]">➜</span>
                      <span className="text-neutral-200">{move.to}</span>
                    </span>
                 </div>
              </div>
              <div className="text-[8px] text-neutral-600 font-mono border border-neutral-800 bg-neutral-900 px-1 rounded">#{move.turnNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;