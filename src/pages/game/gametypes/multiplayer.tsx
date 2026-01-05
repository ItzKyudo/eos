import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { PIECES, PieceKey, getValidMoves, getPieceOwner, PIECE_MOVEMENTS } from '../mechanics/piecemovements';
import { BOARD_COLUMNS } from '../utils/gameUtils';
import { INITIAL_POSITIONS } from '../mechanics/positions';
import MultiplayerHUD, { MoveLog } from '../mechanics/MultiplayerHUD';
import { motion } from 'framer-motion';
import { getValidAttacks, getMandatoryMoves, executeAttack, getMultiCaptureOptions, Winner } from '../mechanics/attackpieces';

interface GameSyncData {
  gameState: Partial<Record<PieceKey, string>>;
  currentTurn: 'player1' | 'player2';
  moveHistory: MoveLog[];
  capturedByP1: PieceKey[];
  capturedByP2: PieceKey[];
  winner: Winner;
  turnPhase: 'select' | 'action' | 'mandatory_move' | 'locked';
  hasMoved: Record<string, boolean>;
  mandatoryMoveUsed: boolean;
}

interface MoveData {
  matchId: string;
  move: GameSyncData;
  playerId?: string;
}

const Multiplayer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const myRole = (searchParams.get('role') as 'player1' | 'player2') || 'player1';
  const matchId = searchParams.get('matchId');
  const userId = searchParams.get('userId');
  const isGuest = searchParams.get('guest') === 'true';
  const initialTime = parseInt(searchParams.get('time') || '600');
  const myUsername = searchParams.get('myName') || (isGuest ? 'Guest' : 'You');
  const opponentUsername = searchParams.get('opponentName') || 'Opponent';

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [moveHistory, setMoveHistory] = useState<MoveLog[]>([]);
  const [capturedByP1, setCapturedByP1] = useState<PieceKey[]>([]);
  const [capturedByP2, setCapturedByP2] = useState<PieceKey[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [winner, setWinner] = useState<Winner>(null);
  const [gameEndReason, setGameEndReason] = useState<string | null>(null);
  const [opponentDisconnectTime, setOpponentDisconnectTime] = useState<number | null>(null);
  const [disconnectTimerStr, setDisconnectTimerStr] = useState<string>('');
  const [turnPhase, setTurnPhase] = useState<'select' | 'action' | 'mandatory_move' | 'locked'>('select');
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(0.65);
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';
  const [p1Time, setP1Time] = useState(initialTime);
  const [p2Time, setP2Time] = useState(initialTime);
  const [opponentConnected, setOpponentConnected] = useState<boolean>(false);

  const perspective = myRole;

  // Socket connection for all multiplayer matches (guest and authenticated)
  useEffect(() => {
    console.log('🔄 Game Page Mounted. Params:', { matchId, isGuest, userId, initialTime });

    if (!matchId) {
      console.warn('⚠️ No matchId provided, skipping socket connection');
      return;
    }

    // Use the same server URL configuration as guest matchmaking
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server.onrender.com';
    console.log('🔌 Attempting to connect to game socket at:', serverUrl);

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true, // Force a new connection to avoid reusing the disconnected matchmaking socket
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(newSocket);
    // Helper to visualize connection state
    (window as any).gameStateDebug = { status: 'Connecting...' };

    newSocket.on('connect', () => {
      console.log('✅ Connected to game server:', newSocket.id);
      (window as any).gameStateDebug.status = 'Connected';
      console.log('📍 Device info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        socketId: newSocket.id,
        matchId: matchId,
        myRole: myRole,
        userId: userId,
      });
      // Join the game room
      console.log('🚪 Emitting joinGame:', { matchId, userId });
      newSocket.emit('joinGame', { matchId, userId });
      // Don't assume opponent is connected - wait for playerJoined event
      // This will be set to true when we receive playerJoined event from server
      setOpponentConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      (window as any).gameStateDebug.status = 'Error: ' + err.message;
    });

    newSocket.on('error', (err: any) => {
      console.error('❌ Server Application Error:', err);
      (window as any).gameStateDebug.status = 'Server Error: ' + (err.message || 'Unknown');
      alert('Game Server Error: ' + (err.message || 'Unknown error'));
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to game server after ${attemptNumber} attempts`);
      newSocket.emit('joinGame', { matchId, userId });
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });

    newSocket.on('moveMade', (data: MoveData) => {
      // Receive move from opponent
      console.log('📥 Move received from opponent:', {
        playerId: data.playerId,
        mySocketId: newSocket.id,
        isFromOpponent: data.playerId !== newSocket.id,
      });

      if (data.move && data.playerId !== newSocket.id) {
        const move = data.move;
        console.log('✅ Applying opponent move to local state');
        setGameState(move.gameState);
        setCurrentTurn(move.currentTurn);
        setMoveHistory(move.moveHistory);
        setCapturedByP1(move.capturedByP1);
        setCapturedByP2(move.capturedByP2);
        setWinner(move.winner);
        setHasMoved(move.hasMoved || {});
        setMandatoryMoveUsed(move.mandatoryMoveUsed || false);

        if (move.currentTurn === myRole) {
          if (move.turnPhase === 'locked') {
            setTurnPhase('locked');
          } else if (move.turnPhase === 'mandatory_move') {
            setTurnPhase('mandatory_move');
          } else {
            setTurnPhase('select');
          }
        } else {
          setTurnPhase('locked');
        }
      } else {
        console.log('⚠️ Ignoring move - from self or invalid data');
      }
    });

    newSocket.on('moveConfirmed', (data: MoveData) => {
      // Move was confirmed by server (for guest matches, this is just confirmation)
      console.log('Move confirmed:', data);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
    });

    newSocket.on('playerJoined', (data: { socketId: string }) => {
      console.log('✅ Opponent joined the game:', data.socketId);
      setOpponentConnected(true);
    });

    newSocket.on('playerReconnected', (data: { socketId: string; userId: string }) => {
      console.log('🔄 Opponent reconnected:', data);
      setOpponentConnected(true);
    });

    newSocket.on('playerDisconnected', (data: { socketId: string; userId: string }) => {
      console.log('⚠️ Opponent disconnected (waiting for reconnect):', data);
      setOpponentConnected(false);
    });

    newSocket.on('playerLeft', (data: { socketId: string }) => {
      console.log('⚠️ Opponent left the game:', data.socketId);
      setOpponentConnected(false);
    });

    newSocket.on('opponentDisconnected', (data: { matchId: string; reason: string; message: string }) => {
      console.log('⚠️ Opponent disconnected event received:', data);
      console.log('📍 Current matchId:', matchId, 'Event matchId:', data.matchId);

      // Only process if this event is for our current match
      if (data.matchId !== matchId) {
        console.log('⚠️ Ignoring opponentDisconnected event - matchId mismatch');
        return;
      }

      console.log('📍 Current state before update:', { myRole, winner, opponentConnected });

      setOpponentConnected(false);
      // Set the current player as the winner since opponent disconnected
      setWinner(myRole);
      setTurnPhase('locked');

      console.log(`🏆 Game over! ${myRole === 'player1' ? 'PLAYER 1' : 'PLAYER 2'} wins by opponent disconnect`);
      console.log('📍 Winner state set to:', myRole);
    });

    newSocket.on('gameEnded', (data: { matchId: string; winner: Winner; reason: string }) => {
      console.log('🏁 Game Ended event:', data);
      if (matchId && data.matchId !== matchId) return;

      setWinner(data.winner);
      setGameEndReason(data.reason);
      setTurnPhase('locked');
      if (data.reason === 'opponent_disconnect') {
        setOpponentConnected(false);
      }
    });

    /* 📥 SYNC HANDLER */
    newSocket.on('gameState', (state: any) => {
      console.log('📥 Received game state sync:', state);

      // Sync Presence
      if (state.onlinePlayers && Array.isArray(state.onlinePlayers)) {
        // If more than 1 player is online, opponent must be online (in 1v1)
        setOpponentConnected(state.onlinePlayers.length > 1);
      }

      // Sync Disconnect Timer
      if (state.players && Array.isArray(state.players)) {
        // Identify opponent (anyone who is not me)
        // Since 'userId' is available from searchParams (Step 557 line 44)
        const op = state.players.find((p: any) => String(p.userId) !== String(userId));
        if (op && op.disconnectedAt) {
          setOpponentDisconnectTime(op.disconnectedAt);
        } else {
          setOpponentDisconnectTime(null);
        }
      }

      // If we have full state from memory (state.lastMove has the board)
      if (state.lastMove) {
        const m = state.lastMove;
        if (m.gameState) setGameState(m.gameState); // Board
        if (state.moves) setMoveHistory(state.moves);
        if (state.currentTurn) setCurrentTurn(state.currentTurn);
        if (state.p1Time) setP1Time(state.p1Time);
        if (state.p2Time) setP2Time(state.p2Time);
        if (state.capturedByP1) setCapturedByP1(state.capturedByP1);
        if (state.capturedByP2) setCapturedByP2(state.capturedByP2);

        // Re-evaluate check/mate via local logic if needed, or trust server state
      }
      // Fallback for DB rehydration (raw moves only)
      else if (state.rehydratedFromDB) {
        // Warning: Board state is missing! 
        // We can set move history list, but board is empty.
        // Client will need logic to "Forward Play" moves to get board.
        // Currently not implemented. Best effort.
        if (state.moves) setMoveHistory(state.moves);
        console.warn('⚠️ Synced from DB History only - Board state may be desynced until next move');
      }
    });

    newSocket.on('playerHeartbeatPong', () => {
      // Server confirmed our heartbeat
      // Connection is alive
    });

    // Set up periodic heartbeat ping (every 5 seconds)
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected && matchId) {
        newSocket.emit('playerHeartbeat', { matchId });
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.disconnect();
      }
    };
  }, [isGuest, matchId, myRole]);

  // BroadcastChannel for local multiplayer (non-guest)
  const broadcastUpdate = (data: GameSyncData) => {
    // If we have a matchId and a connected socket, use the socket (Online Mode)
    if (matchId && socket) {
      // Send move via socket for matches
      if (socket.connected) {
        console.log('📤 Sending move to server:', {
          matchId,
          currentTurn: data.currentTurn,
          moveHistoryLength: data.moveHistory.length,
          socketId: socket.id,
        });
        socket.emit('makeMove', {
          matchId,
          move: data,
        });
      } else {
        console.error('❌ Cannot send move - socket not connected');
      }
    } else {
      // Use BroadcastChannel for local matches
      const channel = new BroadcastChannel('eos_game_sync');
      channel.postMessage(data);
      channel.close();
    }
  };

  useEffect(() => {
    if (isGuest) return; // Skip BroadcastChannel for guest matches

    const channel = new BroadcastChannel('eos_game_sync');

    channel.onmessage = (event) => {
      const data = event.data as GameSyncData;
      setGameState(data.gameState);
      setCurrentTurn(data.currentTurn);
      setMoveHistory(data.moveHistory);
      setCapturedByP1(data.capturedByP1);
      setCapturedByP2(data.capturedByP2);
      setWinner(data.winner);
      if (data.currentTurn === myRole) {
        if (data.turnPhase === 'locked') {
          setTurnPhase('locked');
        } else if (data.turnPhase === 'mandatory_move') {
          setTurnPhase('mandatory_move');
        } else {
          setTurnPhase('select');
        }
      } else {
        setTurnPhase('locked');
      }
    };

    return () => channel.close();
  }, [myRole, isGuest]);
  useEffect(() => {
    if (winner) return;
    const timer = setInterval(() => {
      if (currentTurn === 'player1') setP1Time(t => Math.max(0, t - 1));
      else setP2Time(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTurn, winner]);

  // Timeout Enforcement
  useEffect(() => {
    if (winner) return;

    const handleTimeout = (gameWinner: Winner) => {
      if (!gameWinner) return;

      // Optimistic update
      setWinner(gameWinner);
      setGameEndReason('timeout');
      setTurnPhase('locked');

      if (socket && matchId) {
        console.log('⏰ Timeout! Declaring winner:', gameWinner);
        socket.emit('gameEnd', {
          matchId,
          winner: gameWinner,
          reason: 'timeout'
        });
      }
    };

    // Only the player who ran out of time should report it to avoid race conditions/double reporting,
    // OR we can strictly say: If I am P1 and my time is 0, I lose.
    // If I am P2 and my time is 0, I lose.

    if (p1Time <= 0) {
      if (myRole === 'player1') {
        handleTimeout('player2');
      }
    } else if (p2Time <= 0) {
      if (myRole === 'player2') {
        handleTimeout('player1');
      }
    }
  }, [p1Time, p2Time, winner, myRole, matchId, socket]);

  // Disconnect Timer Effect
  useEffect(() => {
    if (!opponentDisconnectTime) {
      setDisconnectTimerStr('');
      return;
    }
    const updateTimer = () => {
      const diff = 300000 - (Date.now() - opponentDisconnectTime); // 5 mins
      if (diff <= 0) {
        setDisconnectTimerStr('00:00');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setDisconnectTimerStr(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [opponentDisconnectTime]);

  const getPieceAtTile = (coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
  };

  const executeMove = (pieceId: PieceKey, targetCoord: string) => {
    const newGameState = { ...gameState, [pieceId]: targetCoord };
    const newHasMoved = { ...hasMoved, [pieceId]: true };

    const newMove: MoveLog = {
      player: currentTurn,
      pieceName: PIECE_MOVEMENTS[pieceId].name,
      pieceId: pieceId,
      from: gameState[pieceId]!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };
    const newHistory = [...moveHistory, newMove];

    const wasFirstMove = !hasMoved[pieceId];
    let attacks: string[] = [];

    if (turnPhase === 'action') {
      attacks = getValidAttacks(pieceId, targetCoord, newGameState as Record<string, string>, 'post-move', wasFirstMove);
    } else if (turnPhase === 'mandatory_move') {
      attacks = getValidAttacks(pieceId, targetCoord, newGameState as Record<string, string>, 'post-move', false);
    }

    let nextPhase: 'select' | 'action' | 'mandatory_move' | 'locked' = 'locked';
    const nextTurn = currentTurn;

    if (attacks.length > 0) {
      nextPhase = 'mandatory_move';
    } else {
      nextPhase = 'locked';
    }

    setGameState(newGameState);
    setHasMoved(newHasMoved);
    setMandatoryMoveUsed(true);
    setMoveHistory(newHistory);
    setValidMoves([]);
    setValidAttacks(attacks);
    setTurnPhase(nextPhase);
    setCurrentTurn(nextTurn);
    // Clear active piece locally ONLY if turn is over
    if (nextPhase === 'locked') {
      setActivePiece(null);
    }

    broadcastUpdate({
      gameState: newGameState,
      currentTurn: nextTurn,
      moveHistory: newHistory,
      capturedByP1: capturedByP1,
      capturedByP2: capturedByP2,
      winner: winner,
      turnPhase: nextPhase,
      hasMoved: newHasMoved,
      mandatoryMoveUsed: true
    });
  };

  const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
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
        // Execute Move via shared function
        executeMove(activePiece, targetCoord);
      } else {
        // Invalid Drop: Reset if needed, or just let Drag end
        // Current logic just stops dragging. Selection might persist (handled elsewhere).
      }
    }
  }, [isDragging, activePiece, gameState, validMoves, currentTurn, hasMoved, moveHistory, capturedByP1, capturedByP2, winner, turnPhase]);

  const handleMouseDown = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked') return;
    if (currentTurn !== myRole) return;

    // Tap-to-Move: Key difference from Practice, but kept for Multiplayer usability
    if (activePiece && validMoves.includes(coordinate)) {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      executeMove(activePiece, coordinate);
      return;
    }

    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    const pieceId = getPieceAtTile(coordinate);
    if (!pieceId) return; // Align with Practice: Clicking empty (non-move) tile does nothing

    // Check owner
    const owner = getPieceOwner(pieceId);
    if (owner !== myRole) return;

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();

    setActivePiece(pieceId);
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

    if (turnPhase === 'select' || turnPhase === 'action') {
      const isFirstMove = !hasMoved[pieceId];
      const moves = getValidMoves(pieceId, coordinate, isFirstMove, gameState as Record<string, string>);
      const attacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'pre-move', isFirstMove);

      setValidMoves(moves);
      setValidAttacks(attacks);
      setTurnPhase('action');
    }
    else if (turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>);
      let allowedAttacks: string[] = [];

      // Check for attacks (Move-Then-Attack or Chain-Attack)
      // If we already used our mandatory move (or are in a sequence), we might have post-move attacks.
      if (mandatoryMoveUsed) {
        allowedAttacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'post-move', false);
      } else {
        // If we haven't moved yet (e.g. just captured), check for Chain Attacks
        const { attacks } = getMultiCaptureOptions(pieceId, coordinate, gameState as Record<string, string>, false);
        allowedAttacks = attacks;
      }

      setValidMoves(allowedMoves);
      setValidAttacks(allowedAttacks);
    }
  };

  const handleAttackClick = (targetCoord: string) => {
    if (!activePiece || turnPhase === 'locked' || currentTurn !== myRole) return;

    const result = executeAttack(targetCoord, gameState);
    if (!result) return;

    const newGameState = result.newGameState;
    const newCapturedP1 = [...capturedByP1];
    const newCapturedP2 = [...capturedByP2];

    if (currentTurn === 'player1') newCapturedP1.push(result.capturedPieceId);
    else newCapturedP2.push(result.capturedPieceId);

    // Initial State Update (UI)
    setGameState(newGameState);
    setCapturedByP1(newCapturedP1);
    setCapturedByP2(newCapturedP2);

    if (result.winner) {
      setWinner(result.winner);
      setTurnPhase('locked');

      // Note: Practice mode DOES NOT log the winning capture move.
      // We align with that behavior here, though it means the final move isn't shown in history.
      broadcastUpdate({
        gameState: newGameState,
        currentTurn: currentTurn,
        moveHistory: moveHistory, // No new move added
        capturedByP1: newCapturedP1,
        capturedByP2: newCapturedP2,
        winner: result.winner,
        turnPhase: 'locked',
        hasMoved: hasMoved,
        mandatoryMoveUsed: mandatoryMoveUsed
      });
      return;
    }

    const targetName = PIECE_MOVEMENTS[result.capturedPieceId].name;
    const pieceName = PIECE_MOVEMENTS[activePiece].name;
    const newMove: MoveLog = {
      player: currentTurn,
      pieceName: `${pieceName} captures ${targetName}`,
      pieceId: activePiece,
      from: gameState[activePiece]!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };
    const newHistory = [...moveHistory, newMove];

    const { attacks, moves } = getMultiCaptureOptions(
      activePiece,
      newGameState[activePiece]!,
      newGameState as Record<string, string>,
      mandatoryMoveUsed
    );

    let nextPhase: 'select' | 'action' | 'mandatory_move' | 'locked' = 'locked';

    if (attacks.length > 0 || moves.length > 0) {
      nextPhase = 'mandatory_move';
    } else {
      nextPhase = 'locked';
    }

    setMoveHistory(newHistory);
    setValidAttacks(attacks);
    setValidMoves(moves);
    setTurnPhase(nextPhase);

    broadcastUpdate({
      gameState: newGameState,
      currentTurn: currentTurn,
      moveHistory: newHistory,
      capturedByP1: newCapturedP1,
      capturedByP2: newCapturedP2,
      winner: winner,
      turnPhase: nextPhase,
      hasMoved: hasMoved,
      mandatoryMoveUsed: mandatoryMoveUsed
    });
  };



  const handleSwitchTurn = () => {
    if (currentTurn !== myRole) return;

    const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';

    setCurrentTurn(nextTurn);
    setTurnPhase('locked');
    setActivePiece(null);
    setValidMoves([]);
    setValidAttacks([]);
    setMandatoryMoveUsed(false);

    broadcastUpdate({
      gameState: gameState,
      currentTurn: nextTurn,
      moveHistory: moveHistory,
      capturedByP1: capturedByP1,
      capturedByP2: capturedByP2,
      winner: winner,
      turnPhase: 'select',
      hasMoved: hasMoved,
      mandatoryMoveUsed: false
    });
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging && ghostRef.current) {
        if (e.cancelable) e.preventDefault();
        let clientX, clientY;
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }
        ghostRef.current.style.left = `${clientX}px`;
        ghostRef.current.style.top = `${clientY}px`;
      }
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) setBoardScale(Math.min((width - 20) / 1050, 0.65));
      else setBoardScale(0.65);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">

        <div className="absolute top-4 left-4 z-50 flex gap-2 flex-col">
          <div className="flex gap-2">
            <div className={`px-4 py-2 rounded-lg font-bold shadow-lg border text-xs flex items-center gap-2 ${myRole === 'player1' ? 'bg-green-900 border-green-600 text-green-100' : 'bg-blue-900 border-blue-600 text-blue-100'}`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              {myUsername} ({myRole === 'player1' ? 'P1' : 'P2'})
            </div>

            <button
              onClick={() => {
                if (socket && matchId) {
                  console.log('🏳️ Quitting game...');
                  socket.emit('leaveGame', { matchId });
                }
                navigate('/');
              }}
              className="px-3 py-2 bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600 text-xs"
            >
              Quit
            </button>
          </div>

          <div className={`px-4 py-2 rounded-lg font-bold shadow-lg border text-xs flex items-center gap-2 ${opponentConnected ? 'bg-green-900 border-green-600 text-green-100' : 'bg-red-900 border-red-600 text-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${opponentConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            {opponentUsername}: {opponentConnected ? 'ONLINE' : 'OFFLINE'}
            {!opponentConnected && disconnectTimerStr && (
              <span className="ml-2 text-yellow-300 font-mono">
                ({disconnectTimerStr})
              </span>
            )}
          </div>
        </div>
        {winner && (
          <div className="absolute top-24 z-50 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-black text-2xl animate-bounce text-center">
            GAME OVER! {winner === 'player1' ? 'PLAYER 1' : 'PLAYER 2'} WINS!
            {gameEndReason === 'opponent_disconnect' && <div className="text-lg mt-2 font-medium">(Opponent Failed to Reconnect)</div>}
            {gameEndReason === 'opponent_quit' && <div className="text-lg mt-2 font-medium">(Opponent Resigned)</div>}
          </div>
        )}

        {isDragging && activePiece && (
          <div ref={ghostRef} className="fixed pointer-events-none z-100" style={{ left: initialDragPos.x, top: initialDragPos.y, transform: 'translate(-50%, -50%) scale(0.65) scale(1.15)' }}>
            <div className="w-17 h-17 rounded-full shadow-2xl">
              <img src={PIECES[activePiece]} alt="dragging" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        )}

        <div className="origin-center transition-transform duration-500 ease-in-out" style={{ transform: `scale(${boardScale})` }}>
          <div className="relative bg-[#1a8a3d] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-16 border-[#145c2b] flex flex-col items-center">

            <div className="flex items-center mb-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {getRenderCols().map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>

            <div className="flex flex-col space-y-1">
              {getRenderRows().map((row) => {
                const currentTiles = getRowTiles(row);
                const is9TileRow = currentTiles.length === 9;

                return (
                  <div key={row} className="flex items-center">
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-6`}>{row}</div>

                    <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                      {currentTiles.map((coordinate, i) => {
                        const pieceId = getPieceAtTile(coordinate);
                        const isMyPiece = pieceId && getPieceOwner(pieceId) === currentTurn;
                        const isMoveTarget = validMoves.includes(coordinate);
                        const isAttackTarget = validAttacks.includes(coordinate);
                        const canInteract = !winner && (isMyPiece || isAttackTarget);

                        return (
                          <div
                            key={`${row}-${i}`}
                            data-tile={coordinate}
                            onMouseDown={(e) => isAttackTarget ? handleAttackClick(coordinate) : handleMouseDown(coordinate, e)}
                            onTouchStart={(e) => isAttackTarget ? handleAttackClick(coordinate) : handleMouseDown(coordinate, e)}
                            className={`
                              group relative ${circleSize} 
                              bg-linear-to-br from-white to-gray-200 
                              rounded-full 
                              shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                              ${canInteract ? 'cursor-pointer hover:scale-105' : ''}
                              border border-gray-300 
                              shrink-0 flex items-center justify-center
                              shrink-0 flex items-center justify-center
                            `}
                          >
                            {pieceId && (
                              <motion.div
                                layoutId={pieceId}
                                transition={{ type: "spring", stiffness: 280, damping: 25, mass: 0.8 }}
                                className="w-full h-full p-[2px] pointer-events-none z-50 relative"
                              >
                                <img
                                  src={PIECES[pieceId]}
                                  alt="piece"
                                  className={`
                                    w-full h-full rounded-full object-cover 
                                    ${(isDragging && pieceId === activePiece) ? 'opacity-0' : ''} 
                                    select-none shadow-md
                                  `}
                                />
                              </motion.div>
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
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-start pl-6`}>{row}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center mt-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {getRenderCols().map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>

          </div>
        </div>
      </div>

      <MultiplayerHUD
        myRole={myRole}
        gameState={{
          currentTurn,
          moves: moveHistory,
          p1Time,
          p2Time,
          capturedByP1,
          capturedByP2
        }}
        onSwitchTurn={handleSwitchTurn}
        canSwitchTurn={turnPhase === 'locked' && currentTurn === myRole}
        gameStatus={winner ? 'finished' : 'active'}
      />

      {/* Debug Connection Status */}
      {matchId && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50 pointer-events-none">
          Status: {socket?.connected ? '✅ Connected' : '⏳ Connecting...'} <br />
          Socket ID: {socket ? socket.id : 'None'} <br />
          Match ID: {matchId.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};

export default Multiplayer;