import { PieceKey } from '../mechanics/piecemovements';
import { PlayerRole } from '../../../types/gameTypes';

export const BOARD_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];

export const parseCoord = (coord: string) => {
  const colChar = coord.charAt(0);
  const rowNum = parseInt(coord.slice(1));
  const colIndex = BOARD_COLUMNS.indexOf(colChar);
  return { colIndex, rowNum };
};

export const toCoord = (colIndex: number, rowNum: number) => {
  if (colIndex < 0 || colIndex >= BOARD_COLUMNS.length || rowNum < 1 || rowNum > 13) return null;
  return `${BOARD_COLUMNS[colIndex]}${rowNum}`;
};

// --- New Rendering Helpers ---

export const getRenderRows = (perspective: PlayerRole) => {
  const defaultRows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  return perspective === 'player1' ? defaultRows : [...defaultRows].reverse();
};

export const getRenderCols = (perspective: PlayerRole) => {
  return perspective === 'player1' ? BOARD_COLUMNS : [...BOARD_COLUMNS].reverse();
};

export const getRowTiles = (rowNum: number, perspective: PlayerRole) => {
  let tiles: string[] = [];
  switch (rowNum) {
    case 13: tiles = ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13', 'Q13']; break;
    case 12: tiles = ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12']; break;
    case 11: tiles = ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11', 'Q11']; break;
    case 10: tiles = ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10']; break;
    case 9:  tiles = ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9', 'Q9']; break;
    case 8:  tiles = ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8']; break;
    case 7:  tiles = ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7', 'Q7']; break;
    case 6:  tiles = ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6']; break;
    case 5:  tiles = ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5', 'Q5']; break;
    case 4:  tiles = ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4']; break;
    case 3:  tiles = ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3', 'Q3']; break;
    case 2:  tiles = ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2']; break;
    case 1:  tiles = ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1', 'Q1']; break;
    default: tiles = [];
  }
  return perspective === 'player1' ? tiles : tiles.reverse();
};

export const getPieceAtTile = (gameState: Partial<Record<PieceKey, string>>, coordinate: string): PieceKey | undefined => {
  return (Object.keys(gameState) as PieceKey[]).find(key => gameState[key] === coordinate);
};