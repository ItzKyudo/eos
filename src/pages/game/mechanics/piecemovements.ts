// --- 1. UPDATED IMPORTS ---
import piece7_b from '../../../assets/pieces/7-b.png';
import piece7_r from '../../../assets/pieces/7-r.png';
import piece4_b from '../../../assets/pieces/4-b.png';
import piece4_r from '../../../assets/pieces/4-r.png';
import piece3_b from '../../../assets/pieces/3-b.png';
import piece3_r from '../../../assets/pieces/3-r.png';
import piece5_b from '../../../assets/pieces/5-b.png';
import piece5_r from '../../../assets/pieces/5-r.png';
import piece6_b from '../../../assets/pieces/6-b.png';
import piece6_r from '../../../assets/pieces/6-r.png';
import piece1_b from '../../../assets/pieces/1-b.png';
import piece1_r from '../../../assets/pieces/1-r.png';
import piece2_b from '../../../assets/pieces/2-b.png';
import piece2_r from '../../../assets/pieces/2-r.png';

import { parseCoord, toCoord } from '../utils/gameUtils';

export const PIECES = {
  // Originals using the new naming convention
  piece7_b, piece7_r, piece4_b, piece4_r, piece3_b, piece3_r, 
  piece5_b, piece5_r, piece6_b, piece6_r, piece1_b, piece1_r, 
  piece2_b, piece2_r,

  // Clones (mapping to the new variable names)
  piece15: piece4_b, piece16: piece4_r,
  piece17: piece3_b, piece18: piece3_r,
  piece19: piece2_b, piece20: piece2_r,

  // Stewards (Pawns)
  piece21: piece1_b, piece22: piece1_b, piece23: piece1_b, piece24: piece1_b,
  piece25: piece1_b, piece26: piece1_b, piece27: piece1_b, piece28: piece1_b,
  piece29: piece1_r, piece30: piece1_r, piece31: piece1_r, piece32: piece1_r,
  piece33: piece1_r, piece34: piece1_r, piece35: piece1_r, piece36: piece1_r,
};

export type PieceKey = keyof typeof PIECES;

export const PLAYER_1_PIECES = new Set([
  'piece7_b', 'piece4_b', 'piece3_b', 'piece5_b', 'piece6_b', 'piece2_b',
  'piece15', 'piece17', 'piece19',
  'piece21', 'piece22', 'piece23', 'piece24',
  'piece25', 'piece26', 'piece27', 'piece28'
]);

export const PLAYER_2_PIECES = new Set([
  'piece7_r', 'piece4_r', 'piece3_r', 'piece5_r', 'piece6_r', 'piece2_r',
  'piece16', 'piece18', 'piece20',
  'piece29', 'piece30', 'piece31', 'piece32',
  'piece33', 'piece34', 'piece35', 'piece36'
]);

export const getPieceOwner = (pieceId: string): 'player1' | 'player2' | undefined => {
  if (PLAYER_1_PIECES.has(pieceId)) return 'player1';
  if (PLAYER_2_PIECES.has(pieceId)) return 'player2';
  return undefined;
};

// --- 2. UPDATED MOVEMENT RULES ---
const PIECE_RULES: Record<string, number[]> = {
  // Supremo (7-b/7-r)
  piece7_b: [1, 2], piece7_r: [1, 2],

  // Archer (4-b/4-r)
  piece4_b: [1], piece4_r: [1], piece15: [1], piece16: [1],

  // Deacon (3-b/3-r)
  piece3_b: [1], piece3_r: [1], piece17: [1], piece18: [1],

  // Vice Roy (5-b/5-r)
  piece5_b: [1, 2], piece5_r: [1, 2],

  // Chancellor (6-b/6-r)
  piece6_b: [1, 2], piece6_r: [1, 2],

  // Minister (2-b/2-r)
  piece2_b: [1, 2], piece2_r: [1, 2], piece19: [1, 2], piece20: [1, 2],

  // Stewards (1-b/1-r)
  piece21: [1], piece22: [1], piece23: [1], piece24: [1],
  piece25: [1], piece26: [1], piece27: [1], piece28: [1],
  piece29: [1], piece30: [1], piece31: [1], piece32: [1],
  piece33: [1], piece34: [1], piece35: [1], piece36: [1],

  // Fallbacks
  piece1_b: [1], piece1_r: [1],
};

// --- 3. UPDATED SEARCH LOGIC ---
export interface ValidMovesResult {
  moves: string[];
  advanceMoves: string[];
}

export const getValidMoves = (
  pieceId: PieceKey,
  currentPosition: string,
  isFirstMove: boolean,
  currentGameState: Record<string, string>,
  _pieceMoveCount?: Record<string, number>
): ValidMovesResult => {
  const allowedSteps = isFirstMove ? [1, 2, 3, 4] : (PIECE_RULES[pieceId] || [1]);
  const maxNormal = Math.max(...allowedSteps);
  const advanceSteps: number[] = [];
  if (!isFirstMove && maxNormal < 3) {
    for (let d = maxNormal + 1; d <= 3; d++) advanceSteps.push(d);
  }
  const maxSearchDistance = Math.max(maxNormal, advanceSteps.length ? 3 : 0);

  const { colIndex: startCol, rowNum: startRow } = parseCoord(currentPosition);
  if (startCol === -1 || isNaN(startRow)) return { moves: [], advanceMoves: [] };

  const queue = [{ col: startCol, row: startRow, dist: 0 }];
  const visited = new Set<string>();
  visited.add(currentPosition);

  const normalEndPoints = new Set<string>();
  const advanceEndPoints = new Set<string>();
  const directions = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const isBackRankPiece = !pieceId.startsWith('piece2') && !pieceId.startsWith('piece3') || 
    (parseInt(pieceId.replace('piece', ''), 10) <= 20);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (current.dist >= maxSearchDistance) continue;

    for (const [dCol, dRow] of directions) {
      const nextCol = current.col + dCol;
      const nextRow = current.row + dRow;
      const nextCoord = toCoord(nextCol, nextRow);
      if (!nextCoord) continue;
      if ((nextCol + nextRow) % 2 === 0) continue;

      if (visited.has(nextCoord)) continue;

      const isOccupied = Object.values(currentGameState).includes(nextCoord);

      if (isOccupied) {
        // Never allow landing on an occupied tile (no stacking on own or opponent pieces)
        if (isFirstMove && isBackRankPiece) {
          visited.add(nextCoord);
          const nextDist = current.dist + 1;
          queue.push({ col: nextCol, row: nextRow, dist: nextDist });
          // Do not add nextCoord to normalEndPoints - it's occupied; only explore beyond (jump over)
          continue;
        } else {
          continue;
        }
      }

      visited.add(nextCoord);
      const nextDist = current.dist + 1;
      queue.push({ col: nextCol, row: nextRow, dist: nextDist });

      if (allowedSteps.includes(nextDist)) {
        normalEndPoints.add(nextCoord);
      } else if (advanceSteps.includes(nextDist)) {
        advanceEndPoints.add(nextCoord);
      }
    }
  }

  return {
    moves: Array.from(normalEndPoints),
    advanceMoves: Array.from(advanceEndPoints),
  };
};

// --- 4. UPDATED PIECE NAMES ---
export const PIECE_MOVEMENTS: Record<PieceKey, { name: string }> = {
  piece7_b: { name: 'Supremo 1' }, piece7_r: { name: 'Supremo 2' },
  piece4_b: { name: 'Archer 1' }, piece4_r: { name: 'Archer 2' },
  piece3_b: { name: 'Deacon 1' }, piece3_r: { name: 'Deacon 2' },
  piece5_b: { name: 'Vice Roy 1' }, piece5_r: { name: 'Vice Roy 2' },
  piece6_b: { name: 'Chancellor 1' }, piece6_r: { name: 'Chancellor 2' },
  piece1_b: { name: 'Steward 1' }, piece1_r: { name: 'Steward 2' },
  piece2_b: { name: 'Minister 1' }, piece2_r: { name: 'Minister 2' },
  piece15: { name: 'Archer 1a' }, piece16: { name: 'Archer 2a' },
  piece17: { name: 'Deacon 1a' }, piece18: { name: 'Deacon 2a' },
  piece19: { name: 'Minister 1a' }, piece20: { name: 'Minister 2a' },
  piece21: { name: 'Steward 1' }, piece22: { name: 'Steward 1' },
  piece23: { name: 'Steward 1' }, piece24: { name: 'Steward 1' },
  piece25: { name: 'Steward 1' }, piece26: { name: 'Steward 1' },
  piece27: { name: 'Steward 1' }, piece28: { name: 'Steward 1' },
  piece29: { name: 'Steward 2' }, piece30: { name: 'Steward 2' },
  piece31: { name: 'Steward 2' }, piece32: { name: 'Steward 2' },
  piece33: { name: 'Steward 2' }, piece34: { name: 'Steward 2' },
  piece35: { name: 'Steward 2' }, piece36: { name: 'Steward 2' },
};