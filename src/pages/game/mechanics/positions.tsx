import { PieceKey } from './piecemovements';

export const INITIAL_POSITIONS: Partial<Record<PieceKey, string>> = {
  // --- Player 1 (Bottom - Red) ---
  piece2_r:  'Q1',  // Minister 1
  piece5_r:  'O1',  // Vice Roy 1 
  piece3_r:  'M1',  // Deacon 1
  piece6_r:  'K1',  // Chancellor 1
  piece7_r:  'I1',  // Supremo 1
  piece4_r:  'G1',  // Archer 1
  piece16:   'E1',  // Archer 1a 
  piece18:   'C1',  // Deacon 1a 
  piece20:   'A1',  // Minister 1a 
  
  // ROW 2 (Stewards)
  piece29: 'B2', piece30: 'D2', piece31: 'F2', piece32: 'H2',
  piece33: 'J2', piece34: 'L2', piece35: 'N2', piece36: 'P2',

  // --- Player 2 (Top - Blue/Black) ---
  piece2_b:  'Q13', // Minister 2
  piece5_b:  'O13', // Vice Roy 2
  piece3_b:  'M13', // Deacon 2
  piece6_b:  'K13', // Chancellor 2
  piece7_b:  'I13', // Supremo 2
  piece4_b:  'G13', // Archer 2
  piece15:   'E13', // Archer 2a
  piece17:   'C13', // Deacon 2a
  piece19:   'A13', // Minister 2a

  // ROW 12 (Stewards)
  piece21: 'B12', piece22: 'D12', piece23: 'F12', piece24: 'H12',
  piece25: 'J12', piece26: 'L12', piece27: 'N12', piece28: 'P12',
};