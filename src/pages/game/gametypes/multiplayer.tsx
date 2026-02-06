import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { PIECES, PieceKey, getValidMoves, getPieceOwner, PIECE_MOVEMENTS } from '../mechanics/piecemovements';
import { BOARD_COLUMNS } from '../utils/gameUtils';
import { INITIAL_POSITIONS } from '../mechanics/positions';
import MultiplayerHUD, { MoveLog } from '../mechanics/MultiplayerHUD';
import { motion } from 'framer-motion';
import { getValidAttacks, getMandatoryMoves, executeAttack, getMultiCaptureOptions, Winner, DbAttackRule } from '../mechanics/attackpieces';
import supabase from '../../../config/supabase';

import MultiplayerGameResult from '../components/MultiplayerGameResult';

// --- INTERFACES ---

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
  p1Time?: number;
  p2Time?: number;
}

interface MoveData {
  matchId: string;
  move: GameSyncData;
  playerId?: string;
}

interface DbPiece {
  name: string;
  movement_stats: string | {
    move_steps: number[];
    attack_rules: DbAttackRule
  };
}

interface OnlinePlayer {
  userId: string;
  socketId?: string;
  [key: string]: unknown;
}

interface ServerGameState {
  onlinePlayers?: OnlinePlayer[];
  players?: {
    userId: string;
    username: string;
    rating?: number;
    role?: 'player1' | 'player2';
    isGuest?: boolean;
    disconnectedAt: number | null
  }[];
  lastMove?: Partial<GameSyncData>;
  moves?: MoveLog[];
  currentTurn?: 'player1' | 'player2';
  p1Time?: number;
  p2Time?: number;
  p1Score?: number;
  p2Score?: number;
  capturedByP1?: PieceKey[];
  capturedByP2?: PieceKey[];
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
  const myRating = searchParams.get('myRating') || (isGuest ? '600' : '1200');
  const opponentUsername = searchParams.get('opponentName') || 'Opponent';
  const opponentRating = searchParams.get('opponentRating') || '1200';

  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [players, setPlayers] = useState<OnlinePlayer[]>([]);

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
  const [pieceMoveCount, setPieceMoveCount] = useState<Record<string, number>>({});
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAdvanceMoves, setValidAdvanceMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(0.85);
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';
  const [p1Time, setP1Time] = useState(initialTime);
  const [p2Time, setP2Time] = useState(initialTime);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [opponentConnected, setOpponentConnected] = useState<boolean>(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [p1Rating, setP1Rating] = useState<string>(myRole === 'player1' ? myRating : opponentRating);
  const [p2Rating, setP2Rating] = useState<string>(myRole === 'player2' ? myRating : opponentRating);

  const [moveRules, setMoveRules] = useState<Record<string, number[]>>({});
  const [attackRules, setAttackRules] = useState<Record<string, DbAttackRule>>({});
  const [loadingRules, setLoadingRules] = useState(true);

  // FIX: Added isSyncing state to block default values until server connects
  const [isSyncing, setIsSyncing] = useState(true);

  const [ratingData, setRatingData] = useState<{
    winnerId: string;
    loserId: string;
    change: number;
    winnerNew: number;
    loserNew: number;
    reason: string;
    score?: number;
  } | null>(null);

  const perspective = myRole;

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // --- DB RULES FETCHING ---
  useEffect(() => {
    const fetchGameRules = async () => {
      try {
        const { data, error } = await supabase
          .from('pieces')
          .select('name, movement_stats');

        if (error) throw error;

        if (data) {
          const loadedMoveRules: Record<string, number[]> = {};
          const loadedAttackRules: Record<string, DbAttackRule> = {};

          (data as DbPiece[]).forEach((piece) => {
            let stats = piece.movement_stats;
            if (typeof stats === 'string') {
              try {
                stats = JSON.parse(stats);
              } catch (e) {
                console.error("Failed to parse JSON for piece:", piece.name, e);
                return;
              }
            }

            const typedStats = stats as { move_steps: number[]; attack_rules: DbAttackRule };

            if (typedStats) {
              loadedMoveRules[piece.name] = typedStats.move_steps;
              loadedAttackRules[piece.name] = typedStats.attack_rules;
            }
          });

          setMoveRules(loadedMoveRules);
          setAttackRules(loadedAttackRules);
        }
      } catch (err) {
        console.error("Error loading game rules:", err);
      } finally {
        setLoadingRules(false);
      }
    };

    fetchGameRules();
  }, []);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!matchId) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      forceNew: true,
      auth: { token: localStorage.getItem('token') }
    });

    setSocket(newSocket);

    (window as unknown as { gameStateDebug: { status: string } }).gameStateDebug = { status: 'Connecting...' };

    newSocket.on('connect', () => {
      newSocket.emit('joinGame', { matchId, userId });
      setOpponentConnected(false);
    });

    newSocket.on('ratingUpdate', (data: {
      winnerId: string;
      loserId: string;
      winnerNew: number;
      loserNew: number;
      change: number;
      score?: number;
      breakdown?: { reason: string; points: number };
    }) => {
      if (data.winnerId === userId || data.loserId === userId) {
        setRatingData({
          winnerId: data.winnerId,
          loserId: data.loserId,
          change: data.change,
          winnerNew: data.winnerNew,
          loserNew: data.loserNew,
          reason: data.breakdown?.reason || 'Game Result',
          score: data.score || data.change
        });
      }
    });
    newSocket.on('moveMade', (data: MoveData) => {
      if (data.move && data.playerId !== newSocket.id) {
        const move = data.move;
        setGameState(move.gameState);
        setCurrentTurn(move.currentTurn);
        setMoveHistory(move.moveHistory);
        setCapturedByP1(move.capturedByP1);
        setCapturedByP2(move.capturedByP2);
        setWinner(move.winner);
        setHasMoved(move.hasMoved || {});
        setMandatoryMoveUsed(move.mandatoryMoveUsed || false);

        if (move.currentTurn === myRole) {
          if (move.turnPhase === 'locked') setTurnPhase('locked');
          else if (move.turnPhase === 'mandatory_move') setTurnPhase('mandatory_move');
          else setTurnPhase('select');
        } else {
          setTurnPhase('locked');
        }
      }
    });

    newSocket.on('playerJoined', () => setOpponentConnected(true));
    newSocket.on('playerReconnected', () => setOpponentConnected(true));
    newSocket.on('playerDisconnected', () => setOpponentConnected(false));

    newSocket.on('opponentDisconnected', (data: { matchId: string }) => {
      if (data.matchId !== matchId) return;
      setOpponentConnected(false);
    });

    newSocket.on('gameEnded', (data: { matchId: string; winner: Winner; reason: string; winnerId?: string; loserId?: string; score?: number }) => {
      if (matchId && data.matchId !== matchId) return;
      setWinner(data.winner);
      setGameEndReason(data.reason);
      setTurnPhase('locked');

      // If server provides IDs in gameEnded, use them as backup if ratingUpdate hasn't arrived
      if (data.winnerId && data.loserId) {
        setRatingData(prev => prev ? prev : {
          winnerId: data.winnerId!,
          loserId: data.loserId!,
          change: data.score || 0,
          winnerNew: 0,
          loserNew: 0,
          reason: data.reason,
          score: data.score
        });
      }

      if (data.reason === 'opponent_disconnect') setOpponentConnected(false);
    });

    newSocket.on('gameState', (state: ServerGameState) => {
      if (state.onlinePlayers && Array.isArray(state.onlinePlayers)) {
        setOpponentConnected(state.onlinePlayers.length > 1);
      }

      if (state.players && Array.isArray(state.players)) {
        setPlayers(state.players);
        const op = state.players.find((p) => String(p.userId) !== String(userId));
        if (op && op.disconnectedAt) setOpponentDisconnectTime(op.disconnectedAt);
        else setOpponentDisconnectTime(null);

        // Update ratings from server
        const player1Obj = state.players.find(p => p.role === 'player1') || state.players[0];
        const player2Obj = state.players.find(p => p.role === 'player2') || state.players[1];

        if (player1Obj?.rating) setP1Rating(String(player1Obj.rating));
        if (player2Obj?.rating) setP2Rating(String(player2Obj.rating));
      }

      // 1. Sync Moves & Time (Independent of lastMove check to be safe)
      if (state.moves) setMoveHistory(state.moves);
      if (state.p1Time !== undefined) setP1Time(state.p1Time);
      if (state.p2Time !== undefined) setP2Time(state.p2Time);
      if (state.p1Score !== undefined) setP1Score(state.p1Score);
      if (state.p2Score !== undefined) setP2Score(state.p2Score);
      if (state.capturedByP1) setCapturedByP1(state.capturedByP1);
      if (state.capturedByP2) setCapturedByP2(state.capturedByP2);

      // 2. Sync Board State (from lastMove or top-level if available)
      if (state.lastMove) {
        const m = state.lastMove;
        if (m.gameState) setGameState(m.gameState);
        if (m.hasMoved) setHasMoved(m.hasMoved);
        if (m.mandatoryMoveUsed !== undefined) setMandatoryMoveUsed(m.mandatoryMoveUsed);
        if (m.winner) setWinner(m.winner);
      }

      // 3. Sync Turn & Phase
      if (state.currentTurn) {
        setCurrentTurn(state.currentTurn);
        if (state.currentTurn === myRole) {
          // Restore correct phase
          const storedPhase = state.lastMove?.turnPhase;
          if (storedPhase === 'mandatory_move') setTurnPhase('mandatory_move');
          else if (storedPhase === 'locked') setTurnPhase('locked');
          else setTurnPhase('select');
        } else {
          setTurnPhase('locked');
        }
      }

      // FIX: Unlock game interaction now that sync is complete
      setIsSyncing(false);
    });

    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected && matchId) {
        newSocket.emit('playerHeartbeat', { matchId });
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      newSocket.off('ratingUpdate');
      newSocket.disconnect();
    };
  }, [isGuest, matchId, myRole, userId]);

  const broadcastUpdate = useCallback((data: GameSyncData) => {
    const s = socketRef.current;
    if (matchId && s) {
      if (s.connected) {
        s.emit('makeMove', { matchId, move: data });
      }
    } else {
      const channel = new BroadcastChannel('eos_game_sync');
      channel.postMessage(data);
      channel.close();
    }
  }, [matchId]);

  useEffect(() => {
    if (isGuest) return;
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
        if (data.turnPhase === 'locked') setTurnPhase('locked');
        else if (data.turnPhase === 'mandatory_move') setTurnPhase('mandatory_move');
        else setTurnPhase('select');
      } else {
        setTurnPhase('locked');
      }
    };
    return () => channel.close();
  }, [myRole, isGuest]);

  useEffect(() => {
    // FIX: Don't tick timer if syncing or winner exists
    if (winner || isSyncing) return;
    const timer = setInterval(() => {
      if (currentTurn === 'player1') setP1Time(t => Math.max(0, t - 1));
      else setP2Time(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTurn, winner, isSyncing]);

  useEffect(() => {
    if (winner) return;
    const handleTimeout = (gameWinner: Winner) => {
      if (!gameWinner) return;
      const isMyWin = gameWinner === myRole;
      if (isMyWin && socket && matchId) {
        const opponent = players.find(p => p.userId !== userId);
        const opponentId = opponent ? opponent.userId : null;
        socket.emit('gameEnd', {
          matchId,
          winner: gameWinner,
          winnerId: userId,
          loserId: opponentId,
          player1Id: myRole === 'player1' ? userId : opponentId,
          reason: 'timeout',
          winCondition: 'timeout',
          gameHistory: moveHistory
        });
      }
      setWinner(gameWinner);
      setGameEndReason('timeout');
      setTurnPhase('locked');
    };

    if (p1Time <= 0 && myRole === 'player1') handleTimeout('player2');
    else if (p1Time <= 0 && myRole === 'player2') handleTimeout('player2');
    else if (p2Time <= 0 && myRole === 'player2') handleTimeout('player1');
    else if (p2Time <= 0 && myRole === 'player1') handleTimeout('player1');

  }, [p1Time, p2Time, winner, myRole, matchId, socket, players, moveHistory, userId]);

  useEffect(() => {
    if (!opponentDisconnectTime) {
      setDisconnectTimerStr('');
      return;
    }
    const updateTimer = () => {
      const diff = 300000 - (Date.now() - opponentDisconnectTime);
      if (diff <= 0) setDisconnectTimerStr('00:00');
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setDisconnectTimerStr(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [opponentDisconnectTime]);

  const getPieceAtTile = (coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
  };

  const executeMove = useCallback((pieceId: PieceKey, targetCoord: string, isAdvanceMove: boolean) => {
    const newGameState = { ...gameState, [pieceId]: targetCoord };
    const newHasMoved = { ...hasMoved, [pieceId]: true };
    const newMoveCount = { ...pieceMoveCount, [pieceId]: (pieceMoveCount[pieceId] || 0) + 1 };

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
    let attacks: string[] = [];

    if (!isAdvanceMove) {
      if (turnPhase === 'action') {
        attacks = getValidAttacks(pieceId, targetCoord, newGameState as Record<string, string>, 'post-move', false, attackRules);
      } else if (turnPhase === 'mandatory_move') {
        attacks = getValidAttacks(pieceId, targetCoord, newGameState as Record<string, string>, 'post-move', false, attackRules);
      }
    }

    let nextPhase: 'select' | 'action' | 'mandatory_move' | 'locked' = 'locked';
    const nextTurn = currentTurn;

    if (attacks.length > 0) nextPhase = 'mandatory_move';
    else nextPhase = 'locked';

    setGameState(newGameState);
    setHasMoved(newHasMoved);
    setPieceMoveCount(newMoveCount);
    setMandatoryMoveUsed(true);
    setMoveHistory(newHistory);
    setValidMoves([]);
    setValidAdvanceMoves([]);
    setValidAttacks(attacks);
    setTurnPhase(nextPhase);
    setCurrentTurn(nextTurn);
    if (nextPhase === 'locked') setActivePiece(null);

    broadcastUpdate({
      gameState: newGameState,
      currentTurn: nextTurn,
      moveHistory: newHistory,
      capturedByP1: capturedByP1,
      capturedByP2: capturedByP2,
      winner: winner,
      turnPhase: nextPhase,
      hasMoved: newHasMoved,
      mandatoryMoveUsed: true,
      p1Time: p1Time,
      p2Time: p2Time
    });
  }, [gameState, hasMoved, pieceMoveCount, moveHistory, currentTurn, turnPhase, attackRules, capturedByP1, capturedByP2, winner, broadcastUpdate]);

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
      const allMoves = [...validMoves, ...validAdvanceMoves];
      if (targetCoord && allMoves.includes(targetCoord)) {
        const isAdvance = validAdvanceMoves.includes(targetCoord);
        executeMove(activePiece, targetCoord, isAdvance);
      }
    }
  }, [isDragging, activePiece, validMoves, validAdvanceMoves, executeMove]);

  const handleMouseDown = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    // FIX: Block interaction if syncing
    if (winner || turnPhase === 'locked' || isSyncing) return;
    if (currentTurn !== myRole) return;

    const allMoves = [...validMoves, ...validAdvanceMoves];
    if (activePiece && allMoves.includes(coordinate)) {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      const isAdvance = validAdvanceMoves.includes(coordinate);
      executeMove(activePiece, coordinate, isAdvance);
      return;
    }

    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    const pieceId = getPieceAtTile(coordinate);
    if (!pieceId) return;

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
      const isLifetimeFirstMove = !hasMoved[pieceId];
      const { moves, advanceMoves } = getValidMoves(pieceId, coordinate, isLifetimeFirstMove, gameState as Record<string, string>, pieceMoveCount, moveRules);
      const attacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'pre-move', true, attackRules);

      setValidMoves(moves);
      setValidAdvanceMoves(advanceMoves);
      setValidAttacks(attacks);
      setTurnPhase('action');
    }
    else if (turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>, pieceMoveCount, moveRules);
      let allowedAttacks: string[] = [];

      if (mandatoryMoveUsed) {
        allowedAttacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'post-move', false, attackRules);
      } else {
        const { attacks } = getMultiCaptureOptions(pieceId, coordinate, gameState as Record<string, string>, false, pieceMoveCount, moveRules);
        allowedAttacks = attacks;
      }

      setValidMoves(allowedMoves);
      setValidAdvanceMoves([]);
      setValidAttacks(allowedAttacks);
    }
  };

  const handleAttackClick = (targetCoord: string) => {
    // FIX: Block interaction if syncing
    if (!activePiece || turnPhase === 'locked' || currentTurn !== myRole || isSyncing) return;

    const result = executeAttack(targetCoord, gameState, activePiece);
    if (!result) return;

    const newGameState = result.newGameState;
    const newCapturedP1 = [...capturedByP1];
    const newCapturedP2 = [...capturedByP2];

    if (currentTurn === 'player1') newCapturedP1.push(result.capturedPieceId);
    else newCapturedP2.push(result.capturedPieceId);

    setGameState(newGameState);
    setCapturedByP1(newCapturedP1);
    setCapturedByP2(newCapturedP2);

    if (result.winner) {
      setWinner(result.winner);
      setTurnPhase('locked');

      if (socket && matchId) {
        const capturedName = PIECE_MOVEMENTS[result.capturedPieceId].name;
        const winCondition = capturedName.includes('Supremo') ? 'supremo_capture' : 'solitude';
        const opponent = players.find(p => p.userId !== userId);
        const opponentId = opponent ? opponent.userId : null;

        let winnerId, loserId;
        if (result.winner === myRole) {
          winnerId = userId;
          loserId = opponentId;
        } else {
          winnerId = opponentId;
          loserId = userId;
        }

        const finalMove: MoveLog = {
          player: currentTurn,
          pieceName: `${PIECE_MOVEMENTS[activePiece].name} captures ${capturedName}`,
          pieceId: activePiece,
          from: gameState[activePiece]!,
          to: targetCoord,
          turnNumber: moveHistory.length + 1,
          timestamp: Date.now()
        };
        const finalHistory = [...moveHistory, finalMove];

        socket.emit('gameEnd', {
          matchId,
          winner: result.winner,
          reason: 'checkmate',
          winnerId,
          loserId,
          player1Id: myRole === 'player1' ? userId : opponentId,
          winCondition,
          gameHistory: finalHistory
        });
      }

      broadcastUpdate({
        gameState: newGameState,
        currentTurn: currentTurn,
        moveHistory: moveHistory,
        capturedByP1: newCapturedP1,
        capturedByP2: newCapturedP2,
        winner: result.winner,
        turnPhase: 'locked',
        hasMoved: hasMoved,
        mandatoryMoveUsed: mandatoryMoveUsed,
        p1Time: p1Time,
        p2Time: p2Time
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
      mandatoryMoveUsed,
      pieceMoveCount,
      moveRules
    );

    let nextPhase: 'select' | 'action' | 'mandatory_move' | 'locked' = 'locked';
    if (attacks.length > 0 || moves.length > 0) nextPhase = 'mandatory_move';
    else nextPhase = 'locked';

    setMoveHistory(newHistory);
    setValidAttacks(attacks);
    setValidMoves(moves);
    setValidAdvanceMoves([]);
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
      mandatoryMoveUsed: mandatoryMoveUsed,
      p1Time: p1Time,
      p2Time: p2Time
    });
  };

  const handleSwitchTurn = () => {
    if (currentTurn !== myRole) return;
    const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';
    setCurrentTurn(nextTurn);
    setTurnPhase('locked');
    setActivePiece(null);
    setValidMoves([]);
    setValidAdvanceMoves([]);
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
      mandatoryMoveUsed: false,
      p1Time: p1Time,
      p2Time: p2Time
    });
  };

  const getRenderRows = () => perspective === 'player1' ? [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const getRenderCols = () => perspective === 'player1' ? BOARD_COLUMNS : [...BOARD_COLUMNS].reverse();
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
      if (width < 1024) {
        const calculatedScale = Math.min((width - 10) / 980, 0.85);
        setBoardScale(Math.max(0.3, calculatedScale));
      } else {
        setBoardScale(0.85);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FIX: Show loading state while syncing or fetching rules
  if (loadingRules || isSyncing) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-neutral-900 text-white flex-col gap-4">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p>{isSyncing ? "Syncing Game State..." : "Loading Game Rules..."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-neutral-800 overflow-hidden">
      <MultiplayerGameResult
        isOpen={!!winner || (!!ratingData && !!ratingData.winnerId)}
        winner={winner}
        winnerId={ratingData?.winnerId || (winner === 'player1' ? (players.find(p => p.role === 'player1')?.userId || players[0]?.userId || null) : (players.find(p => p.role === 'player2')?.userId || players[1]?.userId || null))}
        loserId={ratingData?.loserId || (winner === 'player1' ? (players.find(p => p.role === 'player2')?.userId || players[1]?.userId || null) : (players.find(p => p.role === 'player1')?.userId || players[0]?.userId || null))}
        winnerName={ratingData?.winnerId === userId ? myUsername : opponentUsername}
        loserName={ratingData?.loserId === userId ? myUsername : opponentUsername}
        ratingChange={ratingData?.change || 0}
        reason={ratingData?.reason || gameEndReason || 'Game Over'}
        currentUserId={userId || ''}
        onRestart={() => navigate('/game')}
        onHome={() => navigate('/game')}
      />
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        {/* Removed Old Game Over Banner - now handled by Modal */}
        {/* {winner && (
          <div className="absolute top-24 z-50 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-black text-2xl animate-bounce text-center">
            GAME OVER! {winner === 'player1' ? 'PLAYER 1' : 'PLAYER 2'} WINS!
            {gameEndReason === 'opponent_disconnect' && <div className="text-lg mt-2 font-medium">(Opponent Failed to Reconnect)</div>}
            {gameEndReason === 'opponent_quit' && <div className="text-lg mt-2 font-medium">(Opponent Resigned)</div>}
          </div>
        )} */}

        {isDragging && activePiece && activePiece in PIECES && (
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
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-end pr-1`}>{row}</div>
                    <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                      {currentTiles.map((coordinate, i) => {
                        const pieceId = getPieceAtTile(coordinate);
                        const isMyPiece = pieceId && getPieceOwner(pieceId) === currentTurn;
                        const isMoveTarget = validMoves.includes(coordinate);
                        const isAdvanceTarget = validAdvanceMoves.includes(coordinate);
                        const isAttackTarget = validAttacks.includes(coordinate);
                        const canInteract = !winner && (isMyPiece || isAttackTarget || isMoveTarget || isAdvanceTarget);
                        const lastMove = moveHistory[moveHistory.length - 1];
                        const isLastMoveFrom = lastMove?.from === coordinate;
                        const isLastMoveTo = lastMove?.to === coordinate;

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
                              ${pieceId ? 'z-30' : ''}
                            `}
                          >
                            {(isLastMoveFrom || isLastMoveTo) && (
                              <div className="absolute inset-0 bg-gray-500/40 rounded-full z-10" />
                            )}
                            {pieceId && pieceId in PIECES && (
                              <motion.div
                                layoutId={pieceId}
                                transition={{ type: "spring", stiffness: 280, damping: 25, mass: 0.8 }}
                                className="w-full h-full p-[0.5] pointer-events-none z-50 relative"
                              >
                                <img src={PIECES[pieceId as PieceKey]} alt="piece" className={`w-full h-full rounded-full object-cover ${(isDragging && pieceId === activePiece) ? 'opacity-0' : ''} select-none shadow-md`} />
                              </motion.div>
                            )}
                            {isMoveTarget && !pieceId && (
                              <div className="absolute w-3 h-3 bg-green-500 rounded-full animate-pulse z-20 shadow-[0_0_15px_rgba(74,222,128,1)]" />
                            )}
                            {isAdvanceTarget && !pieceId && (
                              <div className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-pulse z-20 shadow-[0_0_15px_rgba(250,204,21,1)]" />
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
                    <div className={`${sideWidth} text-[#a3dcb5] font-bold text-xl ${rowHeight} flex items-center justify-start pl-1`}>{row}</div>
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
          p1Score,
          p2Score,
          capturedByP1,
          capturedByP2
        }}
        playerDetails={{
          myUsername,
          myRating: myRole === 'player1' ? p1Rating : p2Rating,
          opponentUsername,
          opponentRating: myRole === 'player1' ? p2Rating : p1Rating,
          opponentConnected,
          disconnectTimer: disconnectTimerStr
        }}
        onSwitchTurn={handleSwitchTurn}
        onResign={() => winner ? navigate('/') : setShowResignModal(true)}
        canSwitchTurn={(turnPhase === 'locked' || turnPhase === 'mandatory_move') && currentTurn === myRole}
        gameStatus={winner ? 'finished' : 'active'}
      />

      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Resign Game?</h3>
            <p className="text-neutral-400 mb-6 text-sm">Are you sure you want to resign? You will forfeit the match and this cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResignModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => {
                if (socket && matchId) socket.emit('leaveGame', { matchId });
                setShowResignModal(false);
                // Removed navigate('/') to let the player see the game over modal
              }} className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-900/20 transition-all hover:scale-105">Confirm Resignation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Multiplayer;