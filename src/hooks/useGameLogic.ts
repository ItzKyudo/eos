import { useState, useEffect } from 'react';
import { INITIAL_POSITIONS } from '../pages/game/mechanics/positions';
import { PIECE_MOVEMENTS, PieceKey} from '../pages/game/mechanics/piecemovements';
import { getValidAttacks, executeAttack, getMultiCaptureOptions, Winner } from '../pages/game/mechanics/attackpieces';
import { GameSyncData, MoveLog, PlayerRole, TurnPhase } from '../types/gameTypes';
import { parseCoord } from '../pages/game/utils/gameUtils'


export const useGameLogic = (
  initialTime: number,
  myRole: PlayerRole,
  onStateChange: (newState: GameSyncData) => void,
  isLocal: boolean = false
) => {
  // State
  const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [moveHistory, setMoveHistory] = useState<MoveLog[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>('player1');
  const [capturedByP1, setCapturedByP1] = useState<PieceKey[]>([]);
  const [capturedByP2, setCapturedByP2] = useState<PieceKey[]>([]);
  const [winner, setWinner] = useState<Winner>(null);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('select');
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [startWithCapture, setStartWithCapture] = useState<Record<string, boolean>>({}); 
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);
  const [gameEndReason, setGameEndReason] = useState<string | null>(null);

  // Timers
  const [p1Time, setP1Time] = useState(initialTime);
  const [p2Time, setP2Time] = useState(initialTime);

  const broadcast = (overrides: Partial<GameSyncData> = {}) => {
    const data: GameSyncData = {
      gameState,
      currentTurn: overrides.currentTurn || currentTurn,
      moveHistory,
      capturedByP1,
      capturedByP2,
      winner,
      turnPhase: overrides.turnPhase || turnPhase,
      hasMoved,
      startWithCapture, 
      mandatoryMoveUsed: overrides.mandatoryMoveUsed ?? mandatoryMoveUsed,
      ...overrides
    };
    onStateChange(data);
  };

  useEffect(() => {
    if (winner) return;
    const timer = setInterval(() => {
      if (currentTurn === 'player1') setP1Time(t => Math.max(0, t - 1));
      else setP2Time(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTurn, winner]);

  const applyRemoteMove = (data: GameSyncData) => {
    setGameState(data.gameState);
    setCurrentTurn(data.currentTurn);
    setMoveHistory(data.moveHistory);
    setCapturedByP1(data.capturedByP1);
    setCapturedByP2(data.capturedByP2);
    setWinner(data.winner);
    setHasMoved(data.hasMoved || {});
    setStartWithCapture(data.startWithCapture || {}); 
    setMandatoryMoveUsed(data.mandatoryMoveUsed || false);
    
    if (data.p1Time !== undefined) setP1Time(data.p1Time);
    if (data.p2Time !== undefined) setP2Time(data.p2Time);

    if (data.currentTurn === myRole) {
      if (data.turnPhase === 'locked') setTurnPhase('locked');
      else if (data.turnPhase === 'mandatory_move') setTurnPhase('mandatory_move');
      else setTurnPhase('select');
    } else {
      setTurnPhase('locked');
    }
  };

  const executeMove = (pieceId: PieceKey, targetCoord: string) => {
    const startCoord = gameState[pieceId]!;
    const newGameState = { ...gameState, [pieceId]: targetCoord };
    const newHasMoved = { ...hasMoved, [pieceId]: true };
    
    const wasFirstMove = !hasMoved[pieceId];
    const newStartWithCapture = { ...startWithCapture };
    if (wasFirstMove) {
        newStartWithCapture[pieceId] = false;
    }

    const startPos = parseCoord(startCoord);
    const endPos = parseCoord(targetCoord);
    const moveDistance = Math.abs(endPos.rowNum - startPos.rowNum);
    
    const isAdvanceMove = !wasFirstMove && moveDistance === 3; 

    const newMove: MoveLog = {
      player: currentTurn,
      pieceName: PIECE_MOVEMENTS[pieceId].name,
      pieceId: pieceId,
      from: startCoord,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    };
    const newHistory = [...moveHistory, newMove];

    let attacks: string[] = [];
    let nextPhase: TurnPhase = 'locked';

    if (!isAdvanceMove && (turnPhase === 'action' || turnPhase === 'mandatory_move')) {
      attacks = getValidAttacks(
        pieceId, 
        targetCoord, 
        newGameState as Record<string, string>, 
        'post-move', 
        turnPhase === 'action' ? wasFirstMove : false
      );
    }

    if (attacks.length > 0) {
      nextPhase = 'mandatory_move';
    }
    
    setGameState(newGameState);
    setHasMoved(newHasMoved);
    setStartWithCapture(newStartWithCapture);
    setMoveHistory(newHistory);
    setMandatoryMoveUsed(true);
    setTurnPhase(nextPhase);

    broadcast({ 
        gameState: newGameState, 
        hasMoved: newHasMoved,
        startWithCapture: newStartWithCapture,
        moveHistory: newHistory, 
        turnPhase: nextPhase,
        mandatoryMoveUsed: true 
    });

    return { nextPhase, attacks };
  };

  const executeAttackAction = (targetCoord: string, activePiece: PieceKey) => {
     const result = executeAttack(targetCoord, gameState);
     if (!result) return null;

     const { newGameState, capturedPieceId, winner: newWinner } = result;
     const newCapturedP1 = [...capturedByP1];
     const newCapturedP2 = [...capturedByP2];

     if (currentTurn === 'player1') newCapturedP1.push(capturedPieceId);
     else newCapturedP2.push(capturedPieceId);

     const newHasMoved = { ...hasMoved, [activePiece]: true };
     const newStartWithCapture = { ...startWithCapture };
     if (!hasMoved[activePiece]) {
         newStartWithCapture[activePiece] = true; 
     }

     if (newWinner) {
        setGameState(newGameState);
        setCapturedByP1(newCapturedP1);
        setCapturedByP2(newCapturedP2); // Fixed: was newCapturedByP2
        setWinner(newWinner);
        setTurnPhase('locked');
        broadcast({ 
            gameState: newGameState, 
            winner: newWinner, 
            capturedByP1: newCapturedP1, 
            capturedByP2: newCapturedP2, 
            turnPhase: 'locked' 
        });
        return { winner: newWinner };
     }

     const newMove: MoveLog = {
        player: currentTurn,
        pieceName: `${PIECE_MOVEMENTS[activePiece].name} captures`,
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
        newStartWithCapture[activePiece] || false 
     );

     const nextPhase = (attacks.length > 0 || moves.length > 0) ? 'mandatory_move' : 'locked';

     setGameState(newGameState);
     setHasMoved(newHasMoved);
     setStartWithCapture(newStartWithCapture);
     setCapturedByP1(newCapturedP1);
     setCapturedByP2(newCapturedP2);
     setMoveHistory(newHistory);
     setTurnPhase(nextPhase);

     broadcast({
        gameState: newGameState,
        hasMoved: newHasMoved,
        startWithCapture: newStartWithCapture,
        capturedByP1: newCapturedP1,
        capturedByP2: newCapturedP2,
        moveHistory: newHistory,
        turnPhase: nextPhase
     });

     return { nextPhase, attacks, moves };
  };

  const switchTurn = () => {
    const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';
    setCurrentTurn(nextTurn);
    setTurnPhase(isLocal ? 'select' : 'locked'); 
    setMandatoryMoveUsed(false);

    broadcast({
        currentTurn: nextTurn,
        turnPhase: 'select', 
        mandatoryMoveUsed: false
    });
  };

  return {
    gameState, moveHistory, currentTurn, capturedByP1, capturedByP2,
    winner, setWinner, gameEndReason, setGameEndReason,
    turnPhase, setTurnPhase,
    hasMoved, startWithCapture, 
    mandatoryMoveUsed,
    p1Time, setP1Time, p2Time, setP2Time,
    applyRemoteMove, executeMove, executeAttackAction, switchTurn
  };
};