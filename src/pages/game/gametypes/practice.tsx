import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PIECES, PieceKey, getValidMoves, getPieceOwner, PIECE_MOVEMENTS } from '../mechanics/piecemovements';
import { BOARD_COLUMNS } from '../utils/gameUtils';
import { INITIAL_POSITIONS } from '../mechanics/positions';
import MultiplayerHUD, { MoveLog } from '../mechanics/MultiplayerHUD';
import GameOverModal from '../components/GameOverModal';
import { getValidAttacks, getMandatoryMoves, executeAttack, Winner, DbAttackRule } from '../mechanics/attackpieces';
import supabase from '../../../config/supabase';
import { playRandomMoveSound } from '../utils/soundUtils';

import { calculateCapturePoints } from '../utils/scoring';
import Swal from 'sweetalert2';

// ... (keep earlier imports)

interface DbPiece {
  name: string;
  movement_stats: string | {
    move_steps: number[];
    attack_rules: DbAttackRule
  };
}

// REMOVED PIECE_VALUES CONSTANT - using calculateCapturePoints instead

const Board: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const timeLimit = parseInt(searchParams.get('time') || '600', 10);

  // Game State
  const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [moveHistory, setMoveHistory] = useState<MoveLog[]>([]);
  const [capturedByP1, setCapturedByP1] = useState<PieceKey[]>([]);
  const [capturedByP2, setCapturedByP2] = useState<PieceKey[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Time, setP1Time] = useState(timeLimit);
  const [p2Time, setP2Time] = useState(timeLimit);

  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [winner, setWinner] = useState<Winner>(null);
  const [gameEndReason, setGameEndReason] = useState<string>('');

  // Turn Logic
  const [turnPhase, setTurnPhase] = useState<'select' | 'action' | 'post_move' | 'mandatory_move' | 'locked'>('select');
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [pieceMoveCount, setPieceMoveCount] = useState<Record<string, number>>({});
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);

  // Stats
  const [turnCaptureCount, setTurnCaptureCount] = useState(0);
  const [myDoubleKills, setMyDoubleKills] = useState(0);
  const [myTripleKills, setMyTripleKills] = useState(0);

  // Interaction
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAdvanceMoves, setValidAdvanceMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null); // Ghost ref
  const [initialDragPos, setInitialDragPos] = useState({ x: 0, y: 0 });
  const [boardScale, setBoardScale] = useState(0.85);

  // Rules from DB
  const [moveRules, setMoveRules] = useState<Record<string, number[]>>({});
  const [attackRules, setAttackRules] = useState<Record<string, DbAttackRule>>({});
  const [loadingRules, setLoadingRules] = useState(true);

  // View
  const perspective = 'player1';

  // Constants
  const circleSize = "w-17 h-17";
  const rowHeight = "h-12";
  const gridWidth = 'w-[900px]';
  const sideWidth = 'w-16';

  // --- FETCH RULES ---
  useEffect(() => {
    const fetchGameRules = async () => {
      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 5000)
      );

      try {
        console.log("Fetching game rules...");

        // Race the fetch against the timeout
        const { data, error } = await Promise.race([
          supabase.from('pieces').select('name, movement_stats'),
          timeoutPromise
        ]) as { data: DbPiece[] | null, error: unknown };

        if (error) {
          console.error("Supabase error fetching rules:", error);
          throw error;
        }

        if (data) {
          console.log("Rules data received:", data.length);
          const loadedMoveRules: Record<string, number[]> = {};
          const loadedAttackRules: Record<string, DbAttackRule> = {};

          data.forEach((piece) => {
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
        } else {
          console.warn("No rules data received from Supabase");
        }
      } catch (err) {
        console.error("Error loading game rules (using defaults/empty):", err);
      } finally {
        setLoadingRules(false);
      }
    };

    fetchGameRules();
  }, []);

  // --- TIMERS ---
  useEffect(() => {
    if (winner || loadingRules) return;
    const timer = setInterval(() => {
      if (currentTurn === 'player1') {
        setP1Time(t => {
          if (t <= 0) {
            handleTimeout('player2');
            return 0;
          }
          return t - 1;
        });
      } else {
        setP2Time(t => {
          if (t <= 0) {
            handleTimeout('player1');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTurn, winner, loadingRules]);

  const handleTimeout = (winningPlayer: 'player1' | 'player2') => {
    setWinner(winningPlayer);
    setGameEndReason('timeout');
    setTurnPhase('locked');
  };

  const handleResign = () => {
    const winner = currentTurn === 'player1' ? 'player2' : 'player1';
    setWinner(winner);
    setGameEndReason('resignation');
    setTurnPhase('locked');
  };

  const getPieceAtTile = (coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
  };

  // --- EXECUTE MOVE ---
  const executeMove = useCallback((pieceId: PieceKey, targetCoord: string, isAdvanceMove: boolean) => {
    if (loadingRules) return;

    playRandomMoveSound(); // DIRECT TRIGGER
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
    // let attacks: string[] = []; // Removed unused variable

    let nextPhase: 'select' | 'action' | 'post_move' | 'mandatory_move' | 'locked' = 'locked';

    if (turnPhase === 'action' || turnPhase === 'mandatory_move') {
      nextPhase = 'post_move';

      setActivePiece(pieceId);
      setValidMoves([]);
      setValidAdvanceMoves([]);

      if (isAdvanceMove) {
        setValidAttacks([]);
      } else {
        const possibleAttacks = getValidAttacks(pieceId, targetCoord, newGameState as Record<string, string>, 'post-move', false, attackRules);
        setValidAttacks(possibleAttacks);
      }
    } else {
      nextPhase = 'locked';
      setActivePiece(null);
    }

    setGameState(newGameState);
    setHasMoved(newHasMoved);
    setPieceMoveCount(newMoveCount);
    setMoveHistory(newHistory);
    setMandatoryMoveUsed(true);

    // setValidMoves/Attacks handled above

    setTurnPhase(nextPhase);

    // if (nextPhase === 'locked') setActivePiece(null); // Handled above

    const p1 = calculateCapturePoints(newHistory, 'player1').points;
    const p2 = calculateCapturePoints(newHistory, 'player2').points;
    setP1Score(p1);
    setP2Score(p2);
  }, [loadingRules, gameState, hasMoved, pieceMoveCount, currentTurn, moveHistory, turnPhase, attackRules, capturedByP1, capturedByP2, p1Time, p2Time, validAdvanceMoves]);

  // --- HANDLERS ---
  const handleMouseDown = (coordinate: string, e: React.MouseEvent | React.TouchEvent) => {
    if (winner || turnPhase === 'locked' || loadingRules) return;

    // --- HANDLING POST-MOVE ATTACKS (Capture Phase) ---
    if (turnPhase === 'post_move') {
      if (activePiece && validAttacks.includes(coordinate)) {
        handleAttackClick(coordinate);
        return;
      }
      return;
    }



    // Allow clicking if it's a valid move target OR the active piece itself
    const allMoves = [...validMoves, ...validAdvanceMoves];
    if (turnPhase === 'mandatory_move' && activePiece && gameState[activePiece] !== coordinate && !allMoves.includes(coordinate)) return;

    const pieceId = getPieceAtTile(coordinate);

    // If clicking a valid move tile
    if (activePiece && allMoves.includes(coordinate)) {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      const isAdvance = validAdvanceMoves.includes(coordinate);
      executeMove(activePiece, coordinate, isAdvance);
      return;
    }

    // Select new piece
    if (!pieceId) return;
    const owner = getPieceOwner(pieceId);
    if (owner !== currentTurn) return; // Can only select own pieces

    if (turnPhase === 'mandatory_move' && pieceId !== activePiece) return; // Locked to active piece

    if (e.cancelable && e.type !== 'touchstart') e.preventDefault();

    setActivePiece(pieceId);
    setIsDragging(true);

    // Drag visual setup
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setInitialDragPos({ x: clientX, y: clientY });

    // Calculate Moves
    if (turnPhase === 'select' || turnPhase === 'action') {
      const isLifetimeFirstMove = !hasMoved[pieceId];
      const { moves, advanceMoves } = getValidMoves(pieceId, coordinate, isLifetimeFirstMove, gameState as Record<string, string>, pieceMoveCount, moveRules);
      const attacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'pre-move', true, attackRules);

      setValidMoves(moves);
      setValidAdvanceMoves(advanceMoves);
      setValidAttacks(attacks);
      setTurnPhase('action');
    } else if (turnPhase === 'mandatory_move') {
      // Should already be handled, but just in case re-selecting same piece
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>, attackRules);
      // Check if attacks available (multi-capture path)
      let allowedAttacks: string[] = [];
      if (mandatoryMoveUsed) {
        allowedAttacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'post-move', false, attackRules);
      } else {
        // Multi-capture logic simplified/removed as per multiplayer updates
        allowedAttacks = [];
      }
      setValidMoves(allowedMoves);
      setValidAdvanceMoves([]);
      setValidAttacks(allowedAttacks);
    }
  };

  const handleAttackClick = (targetCoord: string) => {
    if (!activePiece || turnPhase === 'locked') return;

    const result = executeAttack(targetCoord, gameState, activePiece);
    if (!result) return;

    playRandomMoveSound(); // DIRECT TRIGGER ON CAPTURE
    const targetName = PIECE_MOVEMENTS[result.capturedPieceId].name;

    const newGameState = result.newGameState;
    const newCapturedP1 = [...capturedByP1];
    const newCapturedP2 = [...capturedByP2];

    if (currentTurn === 'player1') {
      newCapturedP1.push(result.capturedPieceId);
      setCapturedByP1(newCapturedP1);
    } else {
      newCapturedP2.push(result.capturedPieceId);
      setCapturedByP2(newCapturedP2);
    }

    setGameState(newGameState);

    // Increment capture count for this turn
    const currentCaptureCount = turnCaptureCount + 1;
    setTurnCaptureCount(currentCaptureCount);

    if (result.winner) {
      setWinner(result.winner);
      setGameEndReason(targetName.includes('Supremo') ? 'supremo_capture' : 'solitude');
      setTurnPhase('locked');

      // Final scoring update
      const finalMove: MoveLog = {
        player: currentTurn,
        pieceName: `${PIECE_MOVEMENTS[activePiece].name} captures ${targetName}`,
        pieceId: activePiece,
        from: gameState[activePiece]!,
        to: targetCoord,
        turnNumber: moveHistory.length + 1,
        timestamp: Date.now()
      };
      const finalHistory = [...moveHistory, finalMove];
      const p1 = calculateCapturePoints(finalHistory, 'player1').points;
      const p2 = calculateCapturePoints(finalHistory, 'player2').points;
      setP1Score(p1);
      setP2Score(p2);

      // Log/Use Stats to satisfy linter and verify tracking
      console.log(`Game Over! Double Kills: ${myDoubleKills + (turnCaptureCount + 1 === 2 ? 1 : 0)}, Triple Kills: ${myTripleKills + (turnCaptureCount + 1 >= 3 ? 1 : 0)}`);
      return;
    }

    const newMove: MoveLog = {
      player: currentTurn,
      pieceName: `${PIECE_MOVEMENTS[activePiece].name} captures ${targetName}`,
      pieceId: activePiece,
      from: gameState[activePiece]!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };
    const newHistory = [...moveHistory, newMove];

    const moves = getMandatoryMoves(
      activePiece,
      newGameState[activePiece]!,
      newGameState as Record<string, string>,
      attackRules
    );

    // NEW: Allow capturing again in this phase if valid targets exist.
    const attacks = getValidAttacks(activePiece, newGameState[activePiece]!, newGameState as Record<string, string>, 'pre-move', true, attackRules);

    let nextPhase: 'select' | 'action' | 'post_move' | 'mandatory_move' | 'locked' = 'locked';

    // Logic: If we attacked, we might have mandatory moves (step) OR chain attacks
    if (turnPhase === 'action' || turnPhase === 'mandatory_move') {
      nextPhase = 'mandatory_move';
    } else if (turnPhase === 'post_move') {
      nextPhase = 'post_move';
      // In post-move, we only check attacks, no moves usually? 
      // Actually in multiplayer: setValidMoves([]); setValidAttacks(followUpAttacks);
    }

    // Force mandatory move phase if we have options, but respect intent
    // Actually, simply:
    if (moves.length > 0 || attacks.length > 0) {
      // If we have strict mandatory moves, we must handle them
      // If we have attacks, we can chain
    }

    // Refined Logic matching Multiplayer:
    if (turnPhase === 'action' || turnPhase === 'mandatory_move') {
      nextPhase = 'mandatory_move';
      // attacks calculated above are valid for 'pre-move' style (chain)
    } else if (turnPhase === 'post_move') {
      nextPhase = 'post_move';
      // recalculate attacks for post-move? 
      // In multiplayer loop: const followUpAttacks = getValidAttacks(..., 'post-move', ...);
      // The `attacks` const above used 'pre-move' which is correct for chain.
      // Wait, for post-move capture, we use 'post-move' logic?
      // Let's re-verify multiplayer logic.
      // Multiplayer Case 2: Post-Move Capture -> followUpAttacks = getValidAttacks(..., 'post-move', false, ...)
    }

    // Let's implement simpler logic that covers both:
    let finalAttacks = attacks;
    if (turnPhase === 'post_move') {
      finalAttacks = getValidAttacks(activePiece, newGameState[activePiece]!, newGameState as Record<string, string>, 'post-move', false, attackRules);
      nextPhase = 'post_move';
      // No movement allowed in post-move chain usually, unless it's a specific type?
      // Multiplayer: setValidMoves([]); setValidAttacks(followUpAttacks);
    } else {
      nextPhase = 'mandatory_move';
      // allows moves AND attacks
    }

    if (finalAttacks.length === 0 && moves.length === 0 && nextPhase === 'mandatory_move') {
      nextPhase = 'locked';
    } else if (finalAttacks.length === 0 && nextPhase === 'post_move') {
      // If no more attacks in post-move, do we lock?
      // Multiplayer: setValidAttacks(followUpAttacks). User must End Turn manually.
      // So we keep it post_move but with empty attacks.
    }

    setMoveHistory(newHistory);
    setValidAttacks(finalAttacks);
    setValidMoves(turnPhase === 'post_move' ? [] : moves);
    setValidAdvanceMoves([]);
    setTurnPhase(nextPhase);

    const p1 = calculateCapturePoints(newHistory, 'player1').points;
    const p2 = calculateCapturePoints(newHistory, 'player2').points;
    setP1Score(p1);
    setP2Score(p2);
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
      const allMoves = [...validMoves, ...validAdvanceMoves];
      if (targetCoord && allMoves.includes(targetCoord)) {
        const isAdvance = validAdvanceMoves.includes(targetCoord);
        executeMove(activePiece, targetCoord, isAdvance);
      }
    }
  }, [isDragging, activePiece, validMoves, validAdvanceMoves, executeMove]);

  const handleSwitchTurn = () => {
    // Process Turn Stats
    if (turnCaptureCount === 2) setMyDoubleKills(prev => prev + 1);
    if (turnCaptureCount >= 3) setMyTripleKills(prev => prev + 1);
    setTurnCaptureCount(0); // Reset for next turn

    setCurrentTurn(prev => prev === 'player1' ? 'player2' : 'player1');
    setTurnPhase('select');
    setActivePiece(null);
    setValidMoves([]);
    setValidAdvanceMoves([]);
    setValidAttacks([]);
    setMandatoryMoveUsed(false);
  };



  // --- DRAG GHOST ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging && filterRef.current) {
        if (e.cancelable) e.preventDefault();
        let clientX, clientY;
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }
        filterRef.current.style.left = `${clientX}px`;
        filterRef.current.style.top = `${clientY}px`;
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

  // --- RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Adjust validation/breakpoints as needed
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

  // --- RENDERING HELPERS ---
  const getRenderRows = () => {
    const defaultRows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    return defaultRows;
  };
  const getRenderCols = () => BOARD_COLUMNS;

  const getRowTiles = (rowNum: number) => {
    let tiles: string[] = [];
    // ... same mapping as before ... 
    // Optimization: Generate dynamically since logic is consistent
    // But keeping explicit switch for safety/legacy
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
    }
    return tiles;
  };

  if (loadingRules) {
    return <div className="w-full h-screen bg-neutral-800 flex items-center justify-center text-white">Loading Game Rules...</div>;
  }

  return (
    <div className="flex flex-col xl:flex-row w-full h-screen bg-neutral-800 overflow-hidden">

      {/* 2. MAIN BOARD AREA */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">



        {/* Ghost Piece */}
        {isDragging && activePiece && activePiece in PIECES && (
          <div
            ref={filterRef}
            className="fixed pointer-events-none z-[100]"
            style={{
              left: initialDragPos.x,
              top: initialDragPos.y,
              transform: 'translate(-50%, -50%) scale(1.15)',
              willChange: 'left, top'
            }}
          >
            <div className={`${circleSize} rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] overflow-hidden`}>
              <img src={PIECES[activePiece]} alt="dragging" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Board */}
        <div
          className="origin-center transition-transform duration-500 ease-in-out"
          style={{ transform: `scale(${boardScale})` }}
        >
          <div className="relative bg-[#1a8a3d] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-16 border-[#145c2b] flex flex-col items-center">

            {/* Top Labels */}
            <div className="flex items-center mb-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {getRenderCols().map((col) => <div key={col} className="text-[#a3dcb5] text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>

            {/* Rows */}
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

                        // Interaction States
                        const isMoveTarget = validMoves.includes(coordinate);
                        const isAdvanceTarget = validAdvanceMoves.includes(coordinate);
                        const isAttackTarget = validAttacks.includes(coordinate);

                        const canInteract = !winner && (
                          (isMyPiece && turnPhase !== 'locked' && (turnPhase !== 'mandatory_move' || pieceId === activePiece)) ||
                          isAttackTarget || isMoveTarget || isAdvanceTarget
                        );

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
                               z-10
                             `}
                          >
                            {pieceId && PIECES[pieceId] && (
                              <img
                                src={PIECES[pieceId]}
                                alt="piece"
                                className={`
                                   w-full h-full rounded-full object-cover 
                                   ${(isDragging && pieceId === activePiece) ? 'opacity-30 grayscale' : ''}
                                   pointer-events-none select-none
                                 `}
                              />
                            )}

                            {/* Highlights */}
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

            {/* Bottom Labels */}
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

      {/* 1. HUD: Moved to Right */}
      <MultiplayerHUD
        myRole={perspective} // Determines who is at the bottom
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
          myUsername: 'Player 1',
          opponentUsername: 'Player 2',
          myRating: 'Local',
          opponentRating: 'Local',
          opponentConnected: true,
          disconnectTimer: ''
        }}
        onSwitchTurn={handleSwitchTurn}
        onResign={handleResign}
        onRequestDraw={() => {
          Swal.fire({
            title: 'Practice Mode',
            text: "Draw requests are not available in practice mode.",
            icon: 'info',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'bg-neutral-800 text-white border border-neutral-700',
              title: 'text-xl font-bold',
              confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded'
            }
          });
        }}
        canSwitchTurn={(turnPhase === 'post_move') && !winner}
        gameStatus={winner ? 'finished' : 'active'}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={!!winner}
        onClose={() => navigate('/game')}
        winner={winner}
        currentUserId={winner === 'player1' ? 'p1' : 'p2'} // Simulation
        winnerId={winner === 'player1' ? 'p1' : 'p2'}
        winnerName={winner === 'player1' ? 'Player 1' : 'Player 2'}
        loserName={winner === 'player1' ? 'Player 2' : 'Player 1'}
        winnerRatingChange={0}
        loserRatingChange={0}
        winnerNewRating={1200}
        loserNewRating={1200}
        reason={gameEndReason}
        score={winner === 'player1' ? p1Score : p2Score}
      />
    </div>
  );
};

export default Board;