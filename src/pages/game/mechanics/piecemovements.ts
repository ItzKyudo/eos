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
export const PIECES = {
  piece1, piece2, piece3, piece4, piece5, piece6, piece7,
  piece8, piece9, piece10, piece11, piece12, piece13, piece14,
  piece15: piece3, piece16: piece4, 
  piece17: piece5, piece18: piece6, 
  piece19: piece13, piece20: piece14,
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
const PIECE_RULES: Record<string, number[]> = {
  // Supremo: [1, 2]
  piece1: [1, 2], piece2: [1, 2],
  // Archer: [1]
  piece3: [1], piece4: [1], piece15: [1], piece16: [1],
  // Deacon: [1]
  piece5: [1], piece6: [1], piece17: [1], piece18: [1],
  // Vice Roy: [2]
  piece7: [2], piece8: [2],
  // Chancellor: [2]
  piece9: [2], piece10: [2],
  // Minister: [2]
  piece13: [2], piece14: [2], piece19: [2], piece20: [2],
  // Stewards: [1]
  piece21: [1], piece22: [1], piece23: [1], piece24: [1],
  piece25: [1], piece26: [1], piece27: [1], piece28: [1],
  piece29: [1], piece30: [1], piece31: [1], piece32: [1],
  piece33: [1], piece34: [1], piece35: [1], piece36: [1],
  piece11: [1], piece12: [1],
};
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
const MIN_ROW = 1;
const MAX_ROW = 13;

const parseCoord = (coord: string) => {
  const colChar = coord.charAt(0);
  const rowNum = parseInt(coord.slice(1));
  const colIndex = COLUMNS.indexOf(colChar);
  return { colIndex, rowNum };
};

const toCoord = (colIndex: number, rowNum: number) => {
  return `${COLUMNS[colIndex]}${rowNum}`;
};

export const getValidMoves = (
  pieceId: PieceKey,
  currentPosition: string,
  isFirstMove: boolean,
  currentGameState: Record<string, string>
): string[] => {
  const allowedSteps = isFirstMove ? [1, 2, 3, 4] : (PIECE_RULES[pieceId] || [1]);
  const maxSearchDistance = Math.max(...allowedSteps);
  const { colIndex: startCol, rowNum: startRow } = parseCoord(currentPosition);
  if (startCol === -1 || isNaN(startRow)) return [];
  const queue = [{ col: startCol, row: startRow, dist: 0 }];
  const visited = new Set<string>();
  visited.add(currentPosition);
  const validEndPoints = new Set<string>();
  const directions = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.dist >= maxSearchDistance) continue;
    for (const [dCol, dRow] of directions) {
      const nextCol = current.col + dCol;
      const nextRow = current.row + dRow;
      const nextCoord = toCoord(nextCol, nextRow);
      if (nextCol < 0 || nextCol >= COLUMNS.length || nextRow < MIN_ROW || nextRow > MAX_ROW) continue;
      if ((nextCol + nextRow) % 2 === 0) continue;
      if (visited.has(nextCoord)) continue;
      const isOccupied = Object.values(currentGameState).includes(nextCoord);
      if (isOccupied) continue;
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