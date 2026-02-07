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
  // Originals
  piece7_b, piece7_r, piece4_b, piece4_r, piece3_b, piece3_r,
  piece5_b, piece5_r, piece6_b, piece6_r, piece1_b, piece1_r,
  piece2_b, piece2_r,

  // Clones
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

// FIX: Player 1 (Bottom) is RED (_r)
export const PLAYER_1_PIECES = new Set([
  'piece7_r', 'piece4_r', 'piece3_r', 'piece5_r', 'piece6_r', 'piece2_r',
  'piece16', 'piece18', 'piece20',
  'piece29', 'piece30', 'piece31', 'piece32',
  'piece33', 'piece34', 'piece35', 'piece36'
]);

// FIX: Player 2 (Top) is BLUE (_b)
export const PLAYER_2_PIECES = new Set([
  'piece7_b', 'piece4_b', 'piece3_b', 'piece5_b', 'piece6_b', 'piece2_b',
  'piece15', 'piece17', 'piece19',
  'piece21', 'piece22', 'piece23', 'piece24',
  'piece25', 'piece26', 'piece27', 'piece28'
]);

export const getPieceOwner = (pieceId: string): 'player1' | 'player2' | undefined => {
  if (PLAYER_1_PIECES.has(pieceId)) return 'player1';
  if (PLAYER_2_PIECES.has(pieceId)) return 'player2';
  return undefined;
};

export const PIECE_MOVEMENTS: Record<PieceKey, { name: string }> = {
  piece7_r: { name: 'Supremo 1' }, piece7_b: { name: 'Supremo 2' },
  piece4_r: { name: 'Archer 1' }, piece4_b: { name: 'Archer 2' },
  piece3_r: { name: 'Deacon 1' }, piece3_b: { name: 'Deacon 2' },
  piece5_r: { name: 'Vice Roy 1' }, piece5_b: { name: 'Vice Roy 2' },
  piece6_r: { name: 'Chancellor 1' }, piece6_b: { name: 'Chancellor 2' },
  piece1_r: { name: 'Steward 1' }, piece1_b: { name: 'Steward 2' },
  piece2_r: { name: 'Minister 1' }, piece2_b: { name: 'Minister 2' },

  // Clones
  piece16: { name: 'Archer 1a' }, piece15: { name: 'Archer 2a' },
  piece18: { name: 'Deacon 1a' }, piece17: { name: 'Deacon 2a' },
  piece20: { name: 'Minister 1a' }, piece19: { name: 'Minister 2a' },

  // Stewards
  piece29: { name: 'Steward 1' }, piece30: { name: 'Steward 1' },
  piece31: { name: 'Steward 1' }, piece32: { name: 'Steward 1' },
  piece33: { name: 'Steward 1' }, piece34: { name: 'Steward 1' },
  piece35: { name: 'Steward 1' }, piece36: { name: 'Steward 1' },

  piece21: { name: 'Steward 2' }, piece22: { name: 'Steward 2' },
  piece23: { name: 'Steward 2' }, piece24: { name: 'Steward 2' },
  piece25: { name: 'Steward 2' }, piece26: { name: 'Steward 2' },
  piece27: { name: 'Steward 2' }, piece28: { name: 'Steward 2' },
};

export const getBaseName = (pieceName: string) => {
  return pieceName.replace(/ \d+[a-z]?$/, '').trim();
};

// --- UPDATED SEARCH LOGIC ---
export interface ValidMovesResult {
  moves: string[];
  advanceMoves: string[];
}

export const getValidMoves = (
  pieceId: PieceKey,
  currentPosition: string,
  isFirstMove: boolean,
  currentGameState: Record<string, string>,
  _pieceMoveCount: Record<string, number> | undefined,
  moveRules: Record<string, number[]>
): ValidMovesResult => {
  const fullName = PIECE_MOVEMENTS[pieceId].name;
  const dbName = getBaseName(fullName);

  // Determine normal allowed steps from DB rules
  const allowedSteps = moveRules[dbName] || [1];

  // Calculate advance steps
  // 1. If it is the FIRST move, we allow up to 4 tiles total.
  //    Normal steps are allowedSteps.
  //    Advance steps are [1, 2, 3, 4] excluding allowedSteps.
  // 2. If it is NOT the first move, we check for "advance" bonus (if maxNormal < 3).

  const advanceSteps: number[] = [];

  if (isFirstMove) {
    // Development Move Logic: Up to 4 tiles
    // Advance steps are those in [1, 2, 3, 4] that are NOT in allowedSteps
    for (let d = 1; d <= 4; d++) {
      if (!allowedSteps.includes(d)) {
        advanceSteps.push(d);
      }
    }
  } else {
    // Existing "Advance" Logic for small pieces
    const maxNormal = Math.max(...allowedSteps);
    if (maxNormal < 3) {
      for (let d = maxNormal + 1; d <= 3; d++) advanceSteps.push(d);
    }
  }

  // Max search distance covers both normal and advance
  const maxNormal = Math.max(...allowedSteps);
  const maxAdvance = advanceSteps.length > 0 ? Math.max(...advanceSteps) : 0;
  const maxSearchDistance = Math.max(maxNormal, maxAdvance);

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
        if (isFirstMove && isBackRankPiece) {
          visited.add(nextCoord);
          const nextDist = current.dist + 1;
          queue.push({ col: nextCol, row: nextRow, dist: nextDist });
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