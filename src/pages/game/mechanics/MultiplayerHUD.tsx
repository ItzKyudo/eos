import React, { useEffect, useRef, useState } from 'react';
import { PIECES, PieceKey } from './piecemovements';
import { Flag, AlertTriangle, LogOut } from 'lucide-react';
import { Winner } from '../../../types/gameTypes'; // Ensure this path is correct

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
  playerDetails: {
    myUsername: string;
    myRating?: string;
    opponentUsername: string;
    opponentRating?: string;
    opponentConnected: boolean;
    disconnectTimer: string;
  };
  winner: Winner;
  gameEndReason: string | null;
  onSwitchTurn: () => void;
  onExit: () => void; // Handles both Resign (if active) and Leave (if finished)
  canSwitchTurn: boolean;
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
  playerDetails,
  winner,
  gameEndReason,
  onExit
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showResignModal, setShowResignModal] = useState(false);

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

  const handleResignClick = () => {
    if (winner) {
      onExit(); // If game is over, just exit
    } else {
      setShowResignModal(true); // If active, ask confirmation
    }
  };

  return (
    <>
      {/* --- 1. Game Over Banner (Overlay) --- */}
      {winner && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-neutral-900/90 backdrop-blur-md text-white px-8 py-4 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-neutral-700 text-center animate-bounce-in">
            <h2 className={`text-2xl font-black uppercase tracking-wider mb-1 ${winner === myRole ? 'text-green-400' : winner === 'draw' ? 'text-yellow-400' : 'text-red-400'}`}>
              {winner === myRole ? 'Victory!' : winner === 'draw' ? 'Draw' : 'Defeat'}
            </h2>
            <p className="text-sm text-neutral-400 font-mono">
              {winner === 'player1' ? 'Player 1' : 'Player 2'} Wins
            </p>
            {gameEndReason && (
              <div className="mt-2 text-xs bg-neutral-800 py-1 px-2 rounded text-neutral-500 uppercase font-bold tracking-widest">
                {gameEndReason.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 2. Side HUD Panel --- */}
      <div className="w-full lg:w-72 h-[30vh] lg:h-auto bg-neutral-900 border-l border-neutral-700 flex flex-col shadow-2xl z-20 font-sans">
        
        {/* Opponent Section */}
        <div className={`p-3 border-b border-neutral-800 transition-colors duration-300 ${opponentData.isTheirTurn ? 'bg-neutral-800/80' : 'bg-neutral-900/50'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${opponentData.color}`}>
                {playerDetails.opponentUsername} <span className="text-neutral-500">({playerDetails.opponentRating || '1200'})</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${playerDetails.opponentConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                <span className={`text-[9px] font-medium ${playerDetails.opponentConnected ? 'text-neutral-400' : 'text-red-400'}`}>
                  {playerDetails.opponentConnected ? 'ONLINE' : 'OFFLINE'}
                  {!playerDetails.opponentConnected && playerDetails.disconnectTimer && ` (${playerDetails.disconnectTimer})`}
                </span>
              </div>
            </div>
            {opponentData.isTheirTurn && !winner && <span className="text-[9px] text-yellow-500 animate-pulse font-bold">THINKING...</span>}
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

        {/* Match Log */}
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-900">
          <div className="px-3 py-1 bg-neutral-800/50 flex justify-between items-center shrink-0 border-b border-neutral-800">
            <h2 className="text-neutral-500 text-[10px] font-bold uppercase">Match Log</h2>
            <span className="bg-neutral-800 text-neutral-400 text-[9px] px-1.5 rounded-full">{gameState.moves.length}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700">
            {gameState.moves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <span className="text-3xl mb-2">⏳</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Ready</span>
              </div>
            ) : (
              <div className="flex flex-col">
                {gameState.moves.map((move, index) => (
                  <div key={index} className="grid grid-cols-[24px_auto_1fr] items-center gap-2 p-2 border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <span className="text-[9px] font-mono text-neutral-600 group-hover:text-neutral-500">{String(move.turnNumber).padStart(2, '0')}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${move.player === 'player1' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10px] font-bold leading-none mb-0.5 ${move.player === 'player1' ? 'text-green-200' : 'text-blue-200'}`}>{move.pieceName}</span>
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

        {/* Player Section */}
        <div className={`p-3 border-t border-neutral-700 transition-all duration-300 ${myData.isMyTurn ? myData.bgColor : 'bg-neutral-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${myData.color}`}>
                {playerDetails.myUsername} <span className="text-neutral-500">({playerDetails.myRating || '1200'})</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                <span className="text-[9px] font-medium text-neutral-400">ONLINE</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {myData.isMyTurn && !canSwitchTurn && !winner && <span className="text-[9px] text-green-400 font-bold self-center">YOUR TURN</span>}
              {myData.isMyTurn && canSwitchTurn && !winner && <span className="text-[9px] text-amber-400 font-bold animate-pulse self-center">CONFIRM MOVE</span>}
              
              <button
                onClick={handleResignClick}
                className="p-1.5 bg-neutral-800 hover:bg-red-900/30 text-neutral-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-900/50 transition-all group"
                title={winner ? "Leave Game" : "Resign Game"}
              >
                {winner ? <LogOut className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5 group-hover:fill-red-400/20" />}
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-wrap gap-0.5 w-24 min-h-[16px]">
              {myData.captures.map((p, i) => <img key={i} src={PIECES[p]} className="w-3 h-3" alt="" />)}
            </div>
            <button
              onClick={onSwitchTurn}
              disabled={!canSwitchTurn || !!winner}
              className={`
                    relative px-4 py-1 rounded-lg font-mono text-xl font-bold border shadow-lg transition-all flex flex-col items-center justify-center min-w-[100px] h-[50px]
                    ${canSwitchTurn && !winner
                  ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500 hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'bg-neutral-700 border-neutral-600 text-neutral-500 cursor-not-allowed opacity-80'
                }
                 `}
            >
              {canSwitchTurn && !winner ? (
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

      {/* --- 3. Resign/Leave Modal (Overlay) --- */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">Resign Game?</h3>
                 <p className="text-neutral-400 text-xs">This will count as a loss for you.</p>
               </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowResignModal(false)} 
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={() => { setShowResignModal(false); onExit(); }} 
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-900/20 transition-all"
              >
                CONFIRM RESIGNATION
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MultiplayerHUD;