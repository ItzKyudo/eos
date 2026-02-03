import { PieceKey, PLAYER_1_PIECES, PLAYER_2_PIECES, getValidMoves, getPieceOwner, PIECE_MOVEMENTS, getBaseName } from './piecemovements';
import { parseCoord, toCoord } from '../utils/gameUtils';

export type Winner = 'player1' | 'player2' | 'draw' | null;

export interface DbAttackRule {
  range: number[];
  mandatory_move: number | number[]; 
  type?: string; 
}

// Diagonal directions for the hex-like grid
const directions: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

function getPieceAtCoord(gameState: Record<string, string>, coord: string): PieceKey | undefined {
  return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coord);
}

export function getValidAttacks(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  phase: 'pre-move' | 'post-move', 
  isFirstMove: boolean, 
  attackRules: Record<string, DbAttackRule>
): string[] {
  
  const owner = getPieceOwner(pieceId);
  if (!owner) return [];

  const fullName = PIECE_MOVEMENTS[pieceId].name;
  const dbName = getBaseName(fullName);
  const rule = attackRules[dbName];

  if (!rule) return [];

  const { colIndex: col, rowNum: row } = parseCoord(position);
  if (col < 0) return [];

  let effectiveRange = rule.range;
  if (dbName === 'Steward') {
    if (isFirstMove && phase === 'pre-move') {
      effectiveRange = [1, 2];
    } else {
      effectiveRange = [1];
    }
  }

  const validTargets: string[] = [];

  for (const [dCol, dRow] of directions) {
    for (const dist of effectiveRange) {
      const targetCol = col + (dist * dCol);
      const targetRow = row + (dist * dRow);
      
      const targetCoord = toCoord(targetCol, targetRow);
      if (!targetCoord) continue;
      let blocked = false;
      for (let k = 1; k < dist; k++) {
        const midCol = col + (k * dCol);
        const midRow = row + (k * dRow);
        const midCoord = toCoord(midCol, midRow);
        if (midCoord && Object.values(gameState).includes(midCoord)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue; 
      const targetPieceId = getPieceAtCoord(gameState, targetCoord);
      
      if (targetPieceId) {
        if (getPieceOwner(targetPieceId) !== owner) {
          validTargets.push(targetCoord);
        }
        // If we hit ANY piece (friend or foe), the range stops here (can't shoot through)
        // break; // Uncomment this 'break' if attacks should stop at the first piece hit
      }
    }
  }

  return validTargets;
}

export function getMandatoryMoves(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  pieceMoveCount: Record<string, number>,
  moveRules: Record<string, number[]>
): string[] {
  
  const isFirstMove = !pieceMoveCount[pieceId];
  const { moves } = getValidMoves(pieceId, position, isFirstMove, gameState, pieceMoveCount, moveRules);
  return moves; 
}

export function executeAttack(
  targetCoord: string,
  gameState: Partial<Record<PieceKey, string>>,
  attackerId: PieceKey
): { newGameState: Partial<Record<PieceKey, string>>; capturedPieceId: PieceKey; winner: Winner } | null {
  
  // 1. Identify the victim
  const capturedPieceId = (Object.keys(gameState) as PieceKey[]).find(k => gameState[k] === targetCoord);
  
  if (!capturedPieceId || capturedPieceId === attackerId) return null;

  // 2. Remove victim, Attacker stays put (Ranged Attack!)
  const newGameState = { ...gameState };
  delete newGameState[capturedPieceId];
  
  // 3. Check Win Condition
  const winner = checkWinCondition(newGameState as Partial<Record<string, string>>);
  
  return { newGameState, capturedPieceId, winner };
}

export function getMultiCaptureOptions(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  _mandatoryMoveUsed: boolean,
  pieceMoveCount: Record<string, number>,
  // attackRules: Record<string, DbAttackRule>, 
  moveRules: Record<string, number[]>
): { attacks: string[]; moves: string[] } {
  

  const moves = getMandatoryMoves(pieceId, position, gameState, pieceMoveCount, moveRules);
  return { attacks: [], moves };
}

export const checkWinCondition = (gameState: Partial<Record<string, string>>): Winner => {
  const pieces = Object.keys(gameState);
  const p1SupremoAlive = pieces.includes('piece7_r'); 
  const p2SupremoAlive = pieces.includes('piece7_b'); 

  if (!p1SupremoAlive && !p2SupremoAlive) return 'draw';
  if (!p1SupremoAlive) return 'player2';
  if (!p2SupremoAlive) return 'player1';

  let p1Count = 0;
  let p2Count = 0;
  pieces.forEach(p => {
    if (PLAYER_1_PIECES.has(p as PieceKey)) p1Count++;
    if (PLAYER_2_PIECES.has(p as PieceKey)) p2Count++;
  });

  if (p1Count === 0) return 'player2';
  if (p2Count === 0) return 'player1';

  return null;
};