import { PieceKey, PLAYER_1_PIECES, PLAYER_2_PIECES, getValidMoves, getPieceOwner } from './piecemovements';
import { parseCoord, toCoord } from '../utils/gameUtils';

export type Winner = 'player1' | 'player2' | 'draw' | null;

interface AttackRule {
  range: number[];
  mandatoryMove: number | number[];
}

export const ATTACK_RULES: Record<string, AttackRule> = {
  // Supremo (7-b / 7-r)
  piece7_b: { range: [1, 2], mandatoryMove: 1 },
  piece7_r: { range: [1, 2], mandatoryMove: 1 },
  
  // Archer (4-b / 4-r + Clones)
  piece4_b: { range: [1, 2, 3], mandatoryMove: 1 },
  piece4_r: { range: [1, 2, 3], mandatoryMove: 1 },
  piece15: { range: [1, 2, 3], mandatoryMove: 1 },
  piece16: { range: [1, 2, 3], mandatoryMove: 1 },
  
  // Deacon (3-b / 3-r + Clones)
  piece3_b: { range: [1, 2], mandatoryMove: 1 },
  piece3_r: { range: [1, 2], mandatoryMove: 1 },
  piece17: { range: [1, 2], mandatoryMove: 1 },
  piece18: { range: [1, 2], mandatoryMove: 1 },
  
  // Vice Roy (5-b / 5-r)
  piece5_b: { range: [1, 2], mandatoryMove: [1, 2] },
  piece5_r: { range: [1, 2], mandatoryMove: [1, 2] },
  
  // Chancellor (6-b / 6-r)
  piece6_b: { range: [1, 2, 3], mandatoryMove: [1, 2] },
  piece6_r: { range: [1, 2, 3], mandatoryMove: [1, 2] },
  
  // Minister (2-b / 2-r + Clones)
  piece2_b: { range: [1], mandatoryMove: [1, 2] },
  piece2_r: { range: [1], mandatoryMove: [1, 2] },
  piece19: { range: [1], mandatoryMove: [1, 2] },
  piece20: { range: [1], mandatoryMove: [1, 2] },
  
  // Stewards (All indexed 21-36)
  ...Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [`piece${21 + i}`, { range: [1], mandatoryMove: 1 }])
  )
};

const directions: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

function getPieceAtCoord(gameState: Record<string, string>, coord: string): PieceKey | undefined {
  return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coord);
}

export function getValidAttacks(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  _phase: 'pre-move' | 'post-move',
  _isFirstMove: boolean
): string[] {
  const rule = ATTACK_RULES[pieceId];
  if (!rule) return [];
  const owner = getPieceOwner(pieceId);
  if (!owner) return [];

  const { colIndex: col, rowNum: row } = parseCoord(position);
  if (col < 0 || col >= 17 || row < 1 || row > 13) return [];

  const attacks: string[] = [];
  for (const [dCol, dRow] of directions) {
    for (const d of rule.range) {
      const midCol = col + d * dCol;
      const midRow = row + d * dRow;
      const landCol = col + (d + 1) * dCol;
      const landRow = row + (d + 1) * dRow;
      const midCoord = toCoord(midCol, midRow);
      const landCoord = toCoord(landCol, landRow);
      if (!midCoord || !landCoord) continue;
      if ((landCol + landRow) % 2 === 0) continue;
      const midPiece = getPieceAtCoord(gameState, midCoord);
      if (!midPiece) continue;
      if (getPieceOwner(midPiece) === owner) continue;
      if (Object.values(gameState).includes(landCoord)) continue;
      attacks.push(landCoord);
    }
  }
  return attacks;
}

export function getMandatoryMoves(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  pieceMoveCount: Record<string, number>
): string[] {
  const isFirstMove = !pieceMoveCount[pieceId];
  const { moves, advanceMoves } = getValidMoves(pieceId, position, isFirstMove, gameState, pieceMoveCount);
  return [...moves, ...advanceMoves];
}

export function executeAttack(
  targetCoord: string,
  gameState: Partial<Record<PieceKey, string>>,
  attackerId: PieceKey
): { newGameState: Partial<Record<PieceKey, string>>; capturedPieceId: PieceKey; winner: Winner } | null {
  const fromCoord = gameState[attackerId];
  if (!fromCoord) return null;

  const { colIndex: fromCol, rowNum: fromRow } = parseCoord(fromCoord);
  const { colIndex: toCol, rowNum: toRow } = parseCoord(targetCoord);
  if (fromCol < 0 || toCol < 0) return null;

  const midCol = (fromCol + toCol) / 2;
  const midRow = (fromRow + toRow) / 2;
  if (midCol !== Math.floor(midCol) || midRow !== Math.floor(midRow)) return null;

  const midCoord = toCoord(midCol, midRow);
  if (!midCoord) return null;

  const capturedPieceId = (Object.keys(gameState) as PieceKey[]).find(k => gameState[k] === midCoord);
  if (!capturedPieceId || capturedPieceId === attackerId) return null;

  const newGameState = { ...gameState };
  delete newGameState[capturedPieceId];
  newGameState[attackerId] = targetCoord;

  const winner = checkWinCondition(newGameState as Partial<Record<string, string>>);
  return { newGameState, capturedPieceId, winner };
}

export function getMultiCaptureOptions(
  pieceId: PieceKey,
  position: string,
  gameState: Record<string, string>,
  _mandatoryMoveUsed: boolean,
  pieceMoveCount: Record<string, number>
): { attacks: string[]; moves: string[] } {
  const attacks = getValidAttacks(pieceId, position, gameState, 'post-move', false);
  const moves = getMandatoryMoves(pieceId, position, gameState, pieceMoveCount);
  return { attacks, moves };
}

export const checkWinCondition = (gameState: Partial<Record<string, string>>): Winner => {
  const pieces = Object.keys(gameState);

  // Updated to check for Supremo IDs: piece7_b and piece7_r
  const p1SupremoAlive = pieces.includes('piece7_b');
  const p2SupremoAlive = pieces.includes('piece7_r');

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