import piece1 from '../../../assets/pieces/1.png';
import piece2 from '../../../assets/pieces/2.png';
import piece3 from '../../../assets/pieces/3.png';
import piece4 from '../../../assets/pieces/4.png';
import piece5 from '../../../assets/pieces/5.png';
import piece6 from '../../../assets/pieces/6.png';
import piece7 from '../../../assets/pieces/7.png';
import piece8 from '../../../assets/pieces/8.png';
import piece9 from '../../../assets/pieces/9.png';
import piece10 from '../../../assets/pieces/10.png';
import piece11 from '../../../assets/pieces/11.png';
import piece12 from '../../../assets/pieces/12.png';
import piece13 from '../../../assets/pieces/13.png';
import piece14 from '../../../assets/pieces/14.png';

import { parseCoord, toCoord } from '../utils/gameUtils';

export const PIECES = {
  // Originals
  piece1, piece2, piece3, piece4, piece5, piece6, piece7,
  piece8, piece9, piece10, piece11, piece12, piece13, piece14,
  
  // Clones (1a/2a variants)
  piece15: piece3, piece16: piece4, 
  piece17: piece5, piece18: piece6, 
  piece19: piece13, piece20: piece14,

  // Stewards (Pawns)
  piece21: piece11, piece22: piece11, piece23: piece11, piece24: piece11,
  piece25: piece11, piece26: piece11, piece27: piece11, piece28: piece11,
  piece29: piece12, piece30: piece12, piece31: piece12, piece32: piece12,
  piece33: piece12, piece34: piece12, piece35: piece12, piece36: piece12,
};

export type PieceKey = keyof typeof PIECES;

export const PLAYER_1_PIECES = new Set([
  'piece1', 'piece3', 'piece5', 'piece7', 'piece9', 'piece13', 
  'piece15', 'piece17', 'piece19', 
  'piece21', 'piece22', 'piece23', 'piece24',
  'piece25', 'piece26', 'piece27', 'piece28'
]);

export const PLAYER_2_PIECES = new Set([
  'piece2', 'piece4', 'piece6', 'piece8', 'piece10', 'piece14', 
  'piece16', 'piece18', 'piece20',
  'piece29', 'piece30', 'piece31', 'piece32', 
  'piece33', 'piece34', 'piece35', 'piece36'
]);

export const getPieceOwner = (pieceId: string): 'player1' | 'player2' | undefined => {
  if (PLAYER_1_PIECES.has(pieceId)) return 'player1';
  if (PLAYER_2_PIECES.has(pieceId)) return 'player2';
  return undefined;
};

const PIECE_RULES: Record<string, number[]> = {
  // Supremo
  piece1: [1, 2, 3], piece2: [1, 2, 3],
  // Archer
  piece3: [1, 3], piece4: [1, 3], piece15: [1, 3], piece16: [1, 3],
  // Deacon
  piece5: [1, 3], piece6: [1, 3], piece17: [1, 3], piece18: [1, 3],
  // Vice Roy
  piece7: [2, 3], piece8: [2, 3],
  // Chancellor
  piece9: [2, 3], piece10: [2, 3],
  // Minister
  piece13: [2, 3], piece14: [2, 3], piece19: [2, 3], piece20: [2, 3],
  // Stewards
  piece21: [1, 3], piece22: [1, 3], piece23: [1, 3], piece24: [1, 3],
  piece25: [1, 3], piece26: [1, 3], piece27: [1, 3], piece28: [1, 3],
  piece29: [1, 3], piece30: [1, 3], piece31: [1, 3], piece32: [1, 3],
  piece33: [1, 3], piece34: [1, 3], piece35: [1, 3], piece36: [1, 3],
  // Fallbacks
  piece11: [1, 3], piece12: [1, 3],
};

export const getValidMoves = (
  pieceId: PieceKey,
  currentPosition: string,
  isFirstMove: boolean,
  currentGameState: Record<string, string>,
  hasCapturedFirst: boolean = false // Added argument
): string[] => {
  
  let allowedSteps: number[];

  if (isFirstMove) {
    allowedSteps = [1, 2, 3, 4];
  } else {
    const baseSteps = PIECE_RULES[pieceId] || [1];
    if (hasCapturedFirst) {
      allowedSteps = baseSteps.filter(step => step !== 3);
    } else {
      allowedSteps = baseSteps;
    }
  }

  const maxSearchDistance = Math.max(...allowedSteps);
  const { colIndex: startCol, rowNum: startRow } = parseCoord(currentPosition);
  if (startCol === -1 || isNaN(startRow)) return [];

  const queue = [{ col: startCol, row: startRow, dist: 0 }];
  const visited = new Set<string>();
  visited.add(currentPosition);
  
  const validEndPoints = new Set<string>();
  const directions = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const isBackRankPiece = parseInt(pieceId.replace('piece', ''), 10) <= 20;

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
        const canJump = isFirstMove && isBackRankPiece;
        if (canJump) {
          visited.add(nextCoord);
          queue.push({ col: nextCol, row: nextRow, dist: current.dist + 1 });
          continue;
        } else {
          continue; 
        }
      }

      visited.add(nextCoord);
      const nextDist = current.dist + 1;
      queue.push({ col: nextCol, row: nextRow, dist: nextDist });

      if (allowedSteps.includes(nextDist)) {
        validEndPoints.add(nextCoord);
      }
    }
  }
  return Array.from(validEndPoints);
};

export const PIECE_MOVEMENTS: Record<PieceKey, { name: string }> = {
  piece1: { name: 'Supremo 1' }, piece2: { name: 'Supremo 2' },
  piece3: { name: 'Archer 1' }, piece4: { name: 'Archer 2' },
  piece5: { name: 'Deacon 1' }, piece6: { name: 'Deacon 2' },
  piece7: { name: 'Vice Roy 1' }, piece8: { name: 'Vice Roy 2' },
  piece9: { name: 'Chancellor 1' }, piece10: { name: 'Chancellor 2' },
  piece11: { name: 'Steward 1' }, piece12: { name: 'Steward 2' },
  piece13: { name: 'Minister 1' }, piece14: { name: 'Minister 2' },
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