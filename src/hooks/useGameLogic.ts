import { useState, useCallback, useEffect } from 'react';
import { PieceKey, getValidMoves, getPieceOwner, PIECE_MOVEMENTS } from '../pages/game/mechanics/piecemovements';
import { INITIAL_POSITIONS } from '../pages/game/mechanics/positions';
import { 
  getValidAttacks, 
  getMandatoryMoves, 
  executeAttack, 
  getMultiCaptureOptions,
  Winner 
} from '../pages/game/mechanics/attackpieces';
import { useGameHistory } from '../pages/game/mechanics/MoveHistory';

export type TurnPhase = 'select' | 'action' | 'mandatory_move' | 'locked';

interface UseGameLogicOptions {
  onGameEnd?: (winner: Winner) => void;
  isMultiplayer?: boolean;
  myRole?: 'player1' | 'player2';
}

export const useGameLogic = (options: UseGameLogicOptions = {}) => {
  const [gameState, setGameState] = useState<Partial<Record<PieceKey, string>>>(INITIAL_POSITIONS);
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [winner, setWinner] = useState<Winner>(null);
  const [mandatoryMoveUsed, setMandatoryMoveUsed] = useState(false);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('select');
  const [activePiece, setActivePiece] = useState<PieceKey | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [validAttacks, setValidAttacks] = useState<string[]>([]);
  const [perspective, setPerspective] = useState<'player1' | 'player2'>('player1');
  const [viewMode, setViewMode] = useState<'auto' | 'locked'>('auto');

  const { moveHistory, capturedByP1, capturedByP2, addMove, addCapture } = useGameHistory();

  const handlePieceSelect = useCallback((coordinate: string) => {
    if (winner || turnPhase === 'locked') return;
    if (turnPhase === 'mandatory_move' && gameState[activePiece!] !== coordinate) return;

    const pieceId = (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
    if (!pieceId) return;

    const owner = getPieceOwner(pieceId);
    if ((turnPhase === 'select' || turnPhase === 'action') && owner !== currentTurn) return;

    // In multiplayer, check if it's player's turn
    if (options.isMultiplayer && options.myRole !== currentTurn) return;

    setActivePiece(pieceId);

    if (turnPhase === 'select' || turnPhase === 'action') {
      const isFirstMove = !hasMoved[pieceId];
      const moves = getValidMoves(pieceId, coordinate, isFirstMove, gameState as Record<string, string>);
      const attacks = getValidAttacks(pieceId, coordinate, gameState as Record<string, string>, 'pre-move', isFirstMove);

      setValidMoves(moves);
      setValidAttacks(attacks);
      setTurnPhase('action');
    } else if (turnPhase === 'mandatory_move') {
      const allowedMoves = getMandatoryMoves(pieceId, coordinate, gameState as Record<string, string>);
      setValidMoves(allowedMoves);
      setValidAttacks([]);
    }
  }, [winner, turnPhase, gameState, activePiece, currentTurn, hasMoved, options.isMultiplayer, options.myRole]);

  const handleAttack = useCallback((targetCoord: string) => {
    if (!activePiece || turnPhase === 'locked') return;

    const result = executeAttack(targetCoord, gameState);
    if (!result) return;

    setGameState(result.newGameState);
    addCapture(currentTurn, result.capturedPieceId);

    if (result.winner) {
      setWinner(result.winner);
      setTurnPhase('locked');
      options.onGameEnd?.(result.winner);
      return;
    }

    const targetName = PIECE_MOVEMENTS[result.capturedPieceId].name;
    const pieceName = PIECE_MOVEMENTS[activePiece].name;
    addMove({
      player: currentTurn,
      pieceName: `${pieceName} captures ${targetName}`,
      pieceId: activePiece,
      from: gameState[activePiece]!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    });

    const currentPos = gameState[activePiece]!;
    const { attacks, moves } = getMultiCaptureOptions(
      activePiece,
      currentPos,
      result.newGameState as Record<string, string>,
      mandatoryMoveUsed
    );

    setValidAttacks(attacks);
    setValidMoves(moves);

    if (attacks.length > 0 || moves.length > 0) {
      setTurnPhase('mandatory_move');
    } else {
      setTurnPhase('locked');
    }
  }, [activePiece, turnPhase, gameState, currentTurn, moveHistory, addMove, addCapture, mandatoryMoveUsed, options]);

  const handleMove = useCallback((targetCoord: string) => {
    if (!activePiece || !validMoves.includes(targetCoord)) return;

    const currentCoord = gameState[activePiece];
    setGameState(prev => ({ ...prev, [activePiece]: targetCoord }));
    setHasMoved(prev => ({ ...prev, [activePiece]: true }));
    setMandatoryMoveUsed(true);

    addMove({
      player: currentTurn,
      pieceName: PIECE_MOVEMENTS[activePiece].name,
      pieceId: activePiece,
      from: currentCoord!,
      to: targetCoord,
      turnNumber: moveHistory.length + 1,
      timestamp: Date.now()
    });

    const wasFirstMove = !hasMoved[activePiece];
    let attacks: string[] = [];

    if (turnPhase === 'action') {
      attacks = getValidAttacks(
        activePiece,
        targetCoord,
        { ...gameState, [activePiece]: targetCoord } as Record<string, string>,
        'post-move',
        wasFirstMove
      );
    } else if (turnPhase === 'mandatory_move') {
      attacks = getValidAttacks(
        activePiece,
        targetCoord,
        { ...gameState, [activePiece]: targetCoord } as Record<string, string>,
        'post-move',
        false
      );
    }

    if (attacks.length > 0) {
      setValidMoves([]);
      setValidAttacks(attacks);
      setTurnPhase('mandatory_move');
    } else {
      setValidMoves([]);
      setValidAttacks([]);
      setTurnPhase('locked');
    }
  }, [activePiece, validMoves, gameState, turnPhase, currentTurn, hasMoved, moveHistory, addMove]);

  const switchTurn = useCallback(() => {
    setCurrentTurn(prev => prev === 'player1' ? 'player2' : 'player1');
    setTurnPhase('select');
    setActivePiece(null);
    setValidMoves([]);
    setValidAttacks([]);
    setMandatoryMoveUsed(false);
  }, []);

  const togglePerspective = useCallback(() => {
    setViewMode('locked');
    setPerspective(prev => prev === 'player1' ? 'player2' : 'player1');
  }, []);

  const resetView = useCallback(() => {
    setViewMode('auto');
  }, []);

  useEffect(() => {
    if (viewMode === 'auto') {
      setPerspective(currentTurn);
    }
  }, [currentTurn, viewMode]);

  const getPieceAtTile = useCallback((coordinate: string): PieceKey | undefined => {
    return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
  }, [gameState]);

  return {
    gameState,
    setGameState,
    hasMoved,
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
    getPieceAtTile,
    addMove,
    addCapture
  };
};