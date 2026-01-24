import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getGameConfig, GameMode } from '../config/gameTypes';
import { useGameLogic } from '../../../hooks/useGameLogic';
import SharedGameBoard from '../components/SharedGameBoard';
import MoveHistory from '../mechanics/MoveHistory';
import { Winner } from '../mechanics/attackpieces';
import { PieceKey } from '../mechanics/piecemovements';

interface SocketGameState {
  gameState: Partial<Record<PieceKey, string>>;
  currentTurn: 'player1' | 'player2';
  turnPhase: 'select' | 'action' | 'mandatory_move' | 'locked';
}

interface SocketMove {
  move: {
    player: 'player1' | 'player2';
    pieceName: string;
    pieceId?: PieceKey;
    from: string;
    to: string;
    turnNumber: number;
    timestamp?: number;
  };
  capture?: { 
    player: 'player1' | 'player2'; 
    pieceId: PieceKey;
  };
}

interface SocketMatchInfo {
  opponentName?: string;
  yourName?: string;
}

interface UnifiedGameProps {
  mode: GameMode;
}

const UnifiedGame: React.FC<UnifiedGameProps> = ({ mode }) => {
  const [searchParams] = useSearchParams();
  const config = getGameConfig(mode);
  
  // Extract URL params
  const timeLimit = parseInt(searchParams.get('time') || '600', 10);
  const matchId = searchParams.get('matchId');
  const role = searchParams.get('role') as 'player1' | 'player2' | null;
  const isGuest = searchParams.get('guest') === 'true';
  
  const [boardScale, setBoardScale] = useState(0.85);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [myName, setMyName] = useState<string>('You');

  // Use unified game logic hook
  const {
    gameState,
    setGameState,
    currentTurn,
    setCurrentTurn,
    winner,
    setWinner,
    turnPhase,
    setTurnPhase,
    activePiece,
    validMoves,
    validAttacks,
    perspective,
    viewMode,
    moveHistory,
    capturedByP1,
    capturedByP2,
    handlePieceSelect,
    handleAttack,
    handleMove,
    switchTurn,
    togglePerspective,
    resetView,
    addMove,
    addCapture
  } = useGameLogic({
    isMultiplayer: config.usesSocket,
    myRole: role || undefined,
    onGameEnd: (gameWinner: Winner) => {
      if (config.usesSocket && socketRef.current) {
        socketRef.current.emit('gameOver', { matchId, winner: gameWinner });
      }
    }
  });

  // Socket setup for online modes
  useEffect(() => {
    if (!config.usesSocket || !matchId) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
    const token = localStorage.getItem('token');
    
    const socket = io(serverUrl, {
      auth: { token: isGuest ? undefined : token },
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinMatch', { matchId, role });
    });

    socket.on('gameStateUpdate', (data: SocketGameState) => {
      setGameState(data.gameState);
      setCurrentTurn(data.currentTurn);
      setTurnPhase(data.turnPhase);
    });

    socket.on('opponentMove', (data: SocketMove) => {
      addMove(data.move);
      if (data.capture) {
        addCapture(data.capture.player, data.capture.pieceId);
      }
    });

    socket.on('matchInfo', (data: SocketMatchInfo) => {
      setOpponentName(data.opponentName || 'Opponent');
      setMyName(data.yourName || 'You');
    });

    socket.on('opponentDisconnected', () => {
      alert('Opponent disconnected. You win by default!');
      setWinner(role || 'player1');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.usesSocket, matchId, role, isGuest]);

  // Emit moves to server in online modes
  useEffect(() => {
    if (config.usesSocket && socketRef.current && moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      if (lastMove.player === role) {
        socketRef.current.emit('makeMove', {
          matchId,
          move: lastMove,
          gameState,
          currentTurn,
          turnPhase
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveHistory, config.usesSocket, matchId, role]);

  // Drag handling
  const [isDragging, setIsDragging] = useState(false);
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });

  const handleDragStart = useCallback((coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked') return;
    if (config.usesSocket && role !== currentTurn) return;

    handlePieceSelect(coordinate);
    setIsDragging(true);

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setInitialDragPos({ x: clientX, y: clientY });
  }, [winner, turnPhase, currentTurn, role, config.usesSocket, handlePieceSelect]);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !activePiece) return;
    setIsDragging(false);

    let clientX, clientY;
    if ('changedTouches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const elementUnderMouse = document.elementFromPoint(clientX, clientY);
    const tile = elementUnderMouse?.closest('[data-tile]');

    if (tile) {
      const targetCoord = tile.getAttribute('data-tile');
      if (targetCoord && validMoves.includes(targetCoord)) {
        handleMove(targetCoord);
      }
    }
  }, [isDragging, activePiece, validMoves, handleMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragEnd]);

  // Responsive board scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setBoardScale(Math.min((width - 10) / 980, 0.85));
      } else {
        setBoardScale(0.85);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTimeout = (winner: 'player1' | 'player2') => {
    setWinner(winner);
    setTurnPhase('locked');
    if (config.usesSocket && socketRef.current) {
      socketRef.current.emit('gameOver', { matchId, winner, reason: 'timeout' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden">
      {/* Connection Status for Online Modes */}
      {config.usesSocket && (
        <div className={`absolute top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-bold ${
          isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </div>
      )}

      {/* Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={togglePerspective}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg border border-neutral-600 flex items-center gap-2 transition-all"
          >
            <span className="text-xl">↻</span>
            {perspective === 'player1' ? 'View: P1 (Bottom)' : 'View: P2 (Top)'}
          </button>
          {viewMode === 'locked' && (
            <button onClick={resetView} className="text-[10px] text-neutral-400 underline">
              Reset Auto
            </button>
          )}
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="absolute top-24 z-50 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-black text-2xl animate-bounce text-center">
            GAME OVER! {winner === 'player1' ? (role === 'player1' ? myName : opponentName) : (role === 'player2' ? myName : opponentName)} WINS!
          </div>
        )}

        {/* Mandatory Move Notice */}
        {turnPhase === 'mandatory_move' && !winner && (
          <div className="absolute top-24 z-50 bg-yellow-600 text-white px-6 py-2 rounded-full shadow-lg font-bold animate-pulse text-center">
            {validMoves.length > 0 ? "Capture Successful! You MUST move now." : "Capture Successful! Capture again or End Turn."}
          </div>
        )}

        <SharedGameBoard
          gameState={gameState}
          hasMoved={{}}
          currentTurn={currentTurn}
          turnPhase={turnPhase}
          activePiece={activePiece}
          validMoves={validMoves}
          validAttacks={validAttacks}
          perspective={perspective}
          boardScale={boardScale}
          winner={winner}
          onPieceSelect={handlePieceSelect}
          onAttackClick={handleAttack}
          onDragStart={handleDragStart}
          isMultiplayer={config.usesSocket}
          myRole={role || undefined}
          isDragging={isDragging}
          initialDragPos={initialDragPos}
        />
      </div>

      {/* Move History Panel */}
      <MoveHistory
        moves={moveHistory}
        currentTurn={currentTurn}
        onSwitchTurn={switchTurn}
        canSwitchTurn={turnPhase === 'locked' && (!config.usesSocket || role === currentTurn)}
        capturedByP1={capturedByP1}
        capturedByP2={capturedByP2}
        onTimeout={handleTimeout}
        initialTime={timeLimit}
      />
    </div>
  );
};

export default UnifiedGame;