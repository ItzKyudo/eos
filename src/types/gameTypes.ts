import { PieceKey } from '../pages/game/mechanics/piecemovements';

export type Winner = 'player1' | 'player2' | 'draw' | null;
export type TurnPhase = 'select' | 'action' | 'mandatory_move' | 'locked';
export type PlayerRole = 'player1' | 'player2';

export interface MoveLog {
  player: PlayerRole;
  pieceName: string;
  pieceId?: PieceKey;
  from: string;
  to: string;
  turnNumber: number;
  timestamp?: number;
}

export interface GameSyncData {
  gameState: Partial<Record<PieceKey, string>>;
  currentTurn: PlayerRole;
  moveHistory: MoveLog[];
  capturedByP1: PieceKey[];
  capturedByP2: PieceKey[];
  winner: Winner;
  turnPhase: TurnPhase;
  hasMoved: Record<string, boolean>;
  mandatoryMoveUsed: boolean;
  onlinePlayers?: string[]; 
  p1Time?: number;
  p2Time?: number;
}

export interface MoveData {
  matchId: string;
  move: GameSyncData;
  playerId?: string;
}