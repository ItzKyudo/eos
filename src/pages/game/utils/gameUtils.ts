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