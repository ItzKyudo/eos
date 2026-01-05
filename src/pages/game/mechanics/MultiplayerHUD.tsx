import React, { useEffect, useRef } from 'react';
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

interface MultiplayerHUDProps {
  myRole: 'player1' | 'player2';
  gameState: {
    currentTurn: 'player1' | 'player2';
    moves: MoveLog[];
    p1Time: number;
    p2Time: number;
    capturedByP1: PieceKey[];
    capturedByP2: PieceKey[];
  };
  onSwitchTurn: () => void;
  canSwitchTurn: boolean;
  gameStatus: 'active' | 'finished' | 'waiting';
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const MultiplayerHUD: React.FC<MultiplayerHUDProps> = ({
  myRole,
  gameState,
  onSwitchTurn,
  canSwitchTurn,
  gameStatus
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.moves]);

  const isP1 = myRole === 'player1';
  const myData = {
    role: myRole,
    time: isP1 ? gameState.p1Time : gameState.p2Time,
    captures: isP1 ? gameState.capturedByP1 : gameState.capturedByP2,
    isMyTurn: gameState.currentTurn === myRole,
    color: isP1 ? 'text-green-400' : 'text-blue-400',
    borderColor: isP1 ? 'border-green-500' : 'border-blue-500',
    bgColor: isP1 ? 'bg-green-900/20' : 'bg-blue-900/20'
  };
  const opponentRole = isP1 ? 'player2' : 'player1';
  const opponentData = {
    role: opponentRole,
    time: isP1 ? gameState.p2Time : gameState.p1Time,
    captures: isP1 ? gameState.capturedByP2 : gameState.capturedByP1,
    isTheirTurn: gameState.currentTurn !== myRole,
    color: isP1 ? 'text-blue-400' : 'text-green-400',
    borderColor: 'border-neutral-700',
    bgColor: 'bg-neutral-800'
  };

  return (
    <div className="w-full lg:w-72 h-[30vh] lg:h-auto bg-neutral-900 border-l border-neutral-700 flex flex-col shadow-2xl z-20 font-sans">
      <div className={`p-3 border-b border-neutral-800 transition-colors duration-300 ${opponentData.isTheirTurn ? 'bg-neutral-800/80' : 'bg-neutral-900/50'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${opponentData.color}`}>
            Opponent ({opponentData.role === 'player1' ? 'P1' : 'P2'})
          </span>
          {opponentData.isTheirTurn && <span className="text-[9px] text-yellow-500 animate-pulse font-bold">THINKING...</span>}
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-wrap gap-0.5 w-24 min-h-[16px]">
            {opponentData.captures.map((p, i) => <img key={i} src={PIECES[p]} className="w-3 h-3 opacity-70" alt="" />)}
          </div>
          <div className="px-3 py-1 bg-neutral-800 rounded text-neutral-400 font-mono text-lg font-bold border border-neutral-700">
            {formatTime(opponentData.time)}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0 bg-neutral-900">
        <div className="px-3 py-1 bg-neutral-800/50 flex justify-between items-center shrink-0 border-b border-neutral-800">
          <h2 className="text-neutral-500 text-[10px] font-bold uppercase">Match Log</h2>
          <span className="bg-neutral-800 text-neutral-400 text-[9px] px-1.5 rounded-full">{gameState.moves.length}</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700">
          {gameState.moves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <span className="text-3xl mb-2">⏳</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Ready to Start</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {gameState.moves.map((move, index) => (
                <div key={index} className="grid grid-cols-[24px_auto_1fr] items-center gap-2 p-2 border-b border-white/5 hover:bg-white/5 transition-colors group">
                  {/* Turn Number */}
                  <span className="text-[9px] font-mono text-neutral-600 group-hover:text-neutral-500">
                    {String(move.turnNumber).padStart(2, '0')}
                  </span>

                  {/* Player Badge */}
                  <div className={`
                      w-1.5 h-1.5 rounded-full 
                      ${move.player === 'player1' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}
                   `} />

                  {/* Move Details */}
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-bold leading-none mb-0.5 ${move.player === 'player1' ? 'text-green-200' : 'text-blue-200'}`}>
                      {move.pieceName}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400">
                      <span className="bg-black/30 px-1 rounded text-neutral-300">{move.from}</span>
                      <span className="text-neutral-600">➜</span>
                      <span className="bg-black/30 px-1 rounded text-neutral-200">{move.to}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`p-3 border-t border-neutral-700 transition-all duration-300 ${myData.isMyTurn ? myData.bgColor : 'bg-neutral-800'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${myData.color}`}>
            YOU ({myData.role === 'player1' ? 'P1' : 'P2'})
          </span>
          {myData.isMyTurn && !canSwitchTurn && <span className="text-[9px] text-green-400 font-bold">YOUR TURN</span>}
          {myData.isMyTurn && canSwitchTurn && <span className="text-[9px] text-amber-400 font-bold animate-pulse">CONFIRM MOVE</span>}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-wrap gap-0.5 w-24 min-h-[16px]">
            {myData.captures.map((p, i) => <img key={i} src={PIECES[p]} className="w-3 h-3" alt="" />)}
          </div>
          <button
            onClick={onSwitchTurn}
            disabled={!canSwitchTurn || gameStatus !== 'active'}
            className={`
                  relative px-4 py-1 rounded-lg font-mono text-xl font-bold border shadow-lg transition-all flex flex-col items-center justify-center min-w-[100px] h-[50px]
                  ${canSwitchTurn
                ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500 hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                : 'bg-neutral-700 border-neutral-600 text-neutral-500 cursor-not-allowed opacity-80'
              }
               `}
          >
            {canSwitchTurn ? (
              <>
                <span className="text-sm font-sans uppercase font-black tracking-wide leading-none">END TURN</span>
                <span className="text-[10px] font-mono opacity-80 leading-none mt-1">{formatTime(myData.time)}</span>
              </>
            ) : (
              formatTime(myData.time)
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default MultiplayerHUD;