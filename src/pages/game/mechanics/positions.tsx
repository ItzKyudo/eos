import { PieceKey } from './piecemovements';
export const INITIAL_POSITIONS: Partial<Record<PieceKey, string>> = {
  // --- Group 1 (Bottom) ---
  piece13: 'Q1',  // Minister 1
  piece5:  'O1',  // Deacon 1
  piece3:  'M1',  // Archer 1
  piece9:  'K1',  // Chancellor 1
  piece1:  'I1',  // Supremo 1
  piece7:  'G1',  // Vice Roy 1
  piece15: 'E1',  // Archer 1a 
  piece17: 'C1',  // Deacon 1a 
  piece19: 'A1',  // Minister 1a 
    // ROW 2 (Stewards)
  piece21: 'B2', piece22: 'D2', piece23: 'F2', piece24: 'H2',
  piece25: 'J2', piece26: 'L2', piece27: 'N2', piece28: 'P2',

  // --- Group 2 (Top) ---
  piece14: 'Q13', // Minister 2
  piece6:  'O13', // Deacon 2
  piece4:  'M13', // Archer 2
  piece8:  'K13', // Vice Roy 2
  piece2:  'I13', // Supremo 2
  piece10: 'G13', // Chancellor 2
  piece16: 'E13', // Archer 2a
  piece18: 'C13', // Deacon 2a
  piece20: 'A13', // Minister 2a

  // ROW 12 (Stewards)
  piece29: 'B12', piece30: 'D12', piece31: 'F12', piece32: 'H12',
  piece33: 'J12', piece34: 'L12', piece35: 'N12', piece36: 'P12',
};