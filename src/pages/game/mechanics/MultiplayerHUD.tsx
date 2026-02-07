import React, { useEffect, useRef } from 'react';
import { PIECES, PieceKey } from './piecemovements';
import { Flag, ScrollText, X } from 'lucide-react';

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
    p1Score: number;
    p2Score: number;
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
  onSwitchTurn: () => void;
  onResign: () => void;
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
  gameStatus,
  playerDetails,
  onResign
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
    score: isP1 ? gameState.p1Score : gameState.p2Score,
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
    score: isP1 ? gameState.p2Score : gameState.p1Score,
    captures: isP1 ? gameState.capturedByP2 : gameState.capturedByP1,
    isTheirTurn: gameState.currentTurn !== myRole,
    color: isP1 ? 'text-blue-400' : 'text-green-400',
    borderColor: 'border-neutral-700',
    bgColor: 'bg-neutral-800'
  };

  const [showMobileLog, setShowMobileLog] = React.useState(false);

  return (
    <div className="
      fixed inset-0 z-20 pointer-events-none flex flex-col justify-between font-sans
      xl:static xl:w-72 xl:h-auto xl:bg-neutral-900 xl:border-l xl:border-neutral-700 xl:shadow-2xl xl:pointer-events-auto
    ">
      {/* OPPONENT SECTION (Top) */}
      <div className={`
        pointer-events-auto
        w-full p-3 transition-colors duration-300 backdrop-blur-md
        border-b-2 xl:border-b
        
        md:max-w-md md:mx-auto md:mt-4 md:rounded-xl md:border-2 md:shadow-lg
        xl:max-w-none xl:mx-0 xl:mt-0 xl:rounded-none xl:border-0 xl:border-b xl:shadow-none
        
        ${opponentData.isTheirTurn
          ? 'bg-neutral-800/90 border-yellow-600/50 shadow-[0_4px_20px_rgba(234,179,8,0.1)]'
          : 'bg-neutral-900/80 border-neutral-700/50 xl:bg-neutral-900/50'
        }
      `}>
        <div className="flex justify-between items-center mb-1 xl:mb-2">
          <div className="flex flex-col">
            <span className={`text-[10px] xl:text-xs font-bold uppercase tracking-widest ${opponentData.color}`}>
              {playerDetails.opponentUsername} <span className="text-neutral-500">({playerDetails.opponentRating || '1200'})</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${playerDetails.opponentConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
              <span className={`text-[9px] xl:text-[10px] font-medium ${playerDetails.opponentConnected ? 'text-neutral-400' : 'text-red-400'}`}>
                {playerDetails.opponentConnected ? 'ONLINE' : 'OFFLINE'}
                {!playerDetails.opponentConnected && playerDetails.disconnectTimer && ` (${playerDetails.disconnectTimer})`}
              </span>
            </div>
          </div>
          {opponentData.isTheirTurn && <span className="text-[9px] xl:text-[10px] text-yellow-500 animate-pulse font-bold bg-yellow-500/10 px-2 py-0.5 rounded">THINKING...</span>}
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-0.5 w-24 min-h-[16px]">
              {opponentData.captures.map((p, i) => (p in PIECES ? <img key={i} src={PIECES[p]} className="w-3 h-3 xl:w-4 xl:h-4 opacity-70" alt="" /> : null))}
            </div>
            {/* Score moved to be more compact on mobile if needed, but keeping consistently place for now */}
            <div className="text-[10px] font-bold text-yellow-500 mt-1">
              SCORE: {opponentData.score}
            </div>
          </div>
          <div className="px-3 py-1 bg-neutral-800 rounded text-neutral-400 font-mono text-lg font-bold border border-neutral-700 shadow-inner">
            {formatTime(opponentData.time)}
          </div>
        </div>
      </div>

      {/* MATCH LOG - Desktop Sidebar */}
      <div className="hidden xl:flex flex-1 flex-col min-h-0 bg-neutral-900">
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
                  <span className="text-[9px] font-mono text-neutral-600 group-hover:text-neutral-500">{String(move.turnNumber).padStart(2, '0')}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${move.player === 'player1' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
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

      {/* MATCH LOG - Mobile Overlay */}
      {showMobileLog && (
        <div className="xl:hidden fixed inset-x-4 top-24 bottom-32 z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <div className="p-3 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
            <span className="font-bold text-xs text-neutral-400 uppercase tracking-widest">Match History</span>
            <button onClick={() => setShowMobileLog(false)} className="text-neutral-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {gameState.moves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <span className="text-3xl mb-2">⏳</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Ready to Start</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                {gameState.moves.map((move, index) => (
                  <div key={index} className="grid grid-cols-[24px_auto_1fr] items-center gap-2 p-2 rounded bg-white/5 border border-white/5">
                    <span className="text-[10px] font-mono text-neutral-500">{String(move.turnNumber).padStart(2, '0')}</span>
                    <div className={`w-2 h-2 rounded-full ${move.player === 'player1' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold leading-none ${move.player === 'player1' ? 'text-green-200' : 'text-blue-200'}`}>{move.pieceName}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 bg-black/40 px-1.5 py-0.5 rounded">
                        <span className="text-neutral-300">{move.from}</span>
                        <span className="text-neutral-600">➜</span>
                        <span className="text-neutral-200">{move.to}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      )}

      {/* PLAYER SECTION (Bottom) */}
      <div className={`
        pointer-events-auto
        flex flex-col gap-2 p-3 transition-colors duration-300 backdrop-blur-md
        border-t-2 xl:border-t xl:gap-0
        
        md:max-w-md md:mx-auto md:mb-4 md:rounded-xl md:border-2 md:shadow-lg
        xl:max-w-none xl:mx-0 xl:mb-0 xl:rounded-none xl:border-0 xl:border-t xl:shadow-none

        ${myData.isMyTurn
          ? `${myData.bgColor} border-${myData.borderColor.split('-')[1] || 'green'}-500/50 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]`
          : 'bg-neutral-900/90 border-neutral-700/50 xl:bg-neutral-800'
        }
      `}>
        {/* Helper text for mobile only - simplified */}
        {myData.isMyTurn && canSwitchTurn && (
          <div className="xl:hidden absolute -top-8 left-0 w-full flex justify-center pointer-events-none">
            <span className="px-3 py-1 bg-black/60 text-white text-[10px] rounded-full backdrop-blur font-bold shadow-lg border border-white/10 animate-bounce">
              CONFIRM YOUR MOVE
            </span>
          </div>
        )}

        <div className="flex justify-between items-start mb-1 xl:mb-2">
          <div className="flex flex-col">
            <span className={`text-[10px] xl:text-xs font-bold uppercase tracking-widest ${myData.color}`}>
              {playerDetails.myUsername} <span className="text-neutral-500">({playerDetails.myRating || '1200'})</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
              <span className="text-[9px] xl:text-[10px] font-medium text-neutral-400">ONLINE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myData.isMyTurn && !canSwitchTurn && <span className="hidden xl:inline text-[9px] text-green-400 font-bold self-center">YOUR TURN</span>}
            {myData.isMyTurn && canSwitchTurn && <span className="hidden xl:inline text-[9px] text-amber-400 font-bold animate-pulse self-center">CONFIRM MOVE</span>}

            {/* Mobile Log Toggle */}
            <button
              onClick={() => setShowMobileLog(!showMobileLog)}
              className={`
                 xl:hidden p-1.5 rounded-lg border transition-all group
                 ${showMobileLog ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-neutral-800 text-neutral-500 border-transparent hover:border-neutral-700'}
               `}
              title="Match Log"
            >
              <ScrollText className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResign}
              className="p-1.5 bg-neutral-800 hover:bg-red-900/30 text-neutral-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-900/50 transition-all group pointer-events-auto"
              title="Resign Game"
            >
              <Flag className="w-3.5 h-3.5 group-hover:fill-red-400/20" />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-0.5 w-24 min-h-[16px]">
              {myData.captures.map((p, i) => (p in PIECES ? <img key={i} src={PIECES[p]} className="w-3 h-3 xl:w-4 xl:h-4" alt="" /> : null))}
            </div>
            <div className="text-[10px] font-bold text-yellow-400 mt-1">
              SCORE: {myData.score}
            </div>
          </div>
          <button
            onClick={onSwitchTurn}
            disabled={!canSwitchTurn || gameStatus !== 'active'}
            className={`
                  relative px-4 py-1 rounded-lg font-mono text-xl font-bold border shadow-lg transition-all flex flex-col items-center justify-center min-w-[100px] h-[50px]
                  active:scale-95
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