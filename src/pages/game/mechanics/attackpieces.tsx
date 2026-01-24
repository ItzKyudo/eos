import { PieceKey, PLAYER_1_PIECES, PLAYER_2_PIECES, getValidMoves, getPieceOwner } from './piecemovements';
import { parseCoord, toCoord } from '../utils/gameUtils';

interface AttackRule {
  range: number[];      
  mandatoryMove: number; 
}

export const ATTACK_RULES: Record<string, AttackRule> = {
  // Supremo
  piece1: { range: [1, 2], mandatoryMove: 1 },
  piece2: { range: [1, 2], mandatoryMove: 1 },
  // Archer (Range 3)
  piece3: { range: [3], mandatoryMove: 1 },   
  piece4: { range: [3], mandatoryMove: 1 },
  piece15: { range: [3], mandatoryMove: 1 },
  piece16: { range: [3], mandatoryMove: 1 },
  // Deacon (Range 2)
  piece5: { range: [2], mandatoryMove: 1 },  
  piece6: { range: [2], mandatoryMove: 1 },
  piece17: { range: [2], mandatoryMove: 1 },
  piece18: { range: [2], mandatoryMove: 1 },
  // Vice Roy
  piece7: { range: [2], mandatoryMove: 2 },  
  piece8: { range: [2], mandatoryMove: 2 },
  // Chancellor
  piece9: { range: [3], mandatoryMove: 2 },   
  piece10: { range: [3], mandatoryMove: 2 },
  // Minister
  piece13: { range: [1], mandatoryMove: 2 }, 
  piece14: { range: [1], mandatoryMove: 2 },
  piece19: { range: [1], mandatoryMove: 2 },
  piece20: { range: [1], mandatoryMove: 2 },
  // Stewards
  piece21: { range: [1], mandatoryMove: 1 }, 
  piece22: { range: [1], mandatoryMove: 1 },
  piece23: { range: [1], mandatoryMove: 1 },
  piece24: { range: [1], mandatoryMove: 1 },
  piece25: { range: [1], mandatoryMove: 1 },
  piece26: { range: [1], mandatoryMove: 1 },
  piece27: { range: [1], mandatoryMove: 1 },
  piece28: { range: [1], mandatoryMove: 1 },
  piece29: { range: [1], mandatoryMove: 1 },
  piece30: { range: [1], mandatoryMove: 1 },
  piece31: { range: [1], mandatoryMove: 1 },
  piece32: { range: [1], mandatoryMove: 1 },
  piece33: { range: [1], mandatoryMove: 1 },
  piece34: { range: [1], mandatoryMove: 1 },
  piece35: { range: [1], mandatoryMove: 1 },
  piece36: { range: [1], mandatoryMove: 1 },
  piece11: { range: [1], mandatoryMove: 1 },
  piece12: { range: [1], mandatoryMove: 1 },
};

export const getValidAttacks = (
  pieceId: PieceKey,
  currentPosition: string,
  gameState: Record<string, string>,
  phase: 'pre-move' | 'post-move',
  isFirstMove: boolean
): string[] => {
  if (phase === 'post-move' && isFirstMove) return [];
  const rules = ATTACK_RULES[pieceId] || { range: [1], mandatoryMove: 1 };
  let allowedRanges = rules.range;
  const idNum = parseInt(pieceId.replace('piece', ''), 10);
  const isSteward = (idNum >= 21 && idNum <= 36) || idNum === 11 || idNum === 12;
  if (isSteward && phase === 'pre-move') {
     allowedRanges = [1, 2]; 
  }

  const targets: string[] = [];
  const { colIndex, rowNum } = parseCoord(currentPosition);
  const directions = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  
  const myOwner = getPieceOwner(pieceId);

  directions.forEach(([dCol, dRow]) => {
    const maxDist = Math.max(...allowedRanges);
    for (let dist = 1; dist <= maxDist; dist++) {
      const targetCol = colIndex + (dCol * dist);
      const targetRow = rowNum + (dRow * dist);
      const targetCoord = toCoord(targetCol, targetRow);

      if (!targetCoord) break;
      if ((targetCol + targetRow) % 2 === 0) continue; 

      const occupantId = Object.keys(gameState).find(key => gameState[key] === targetCoord);

      if (occupantId) {
        const occupantOwner = getPieceOwner(occupantId);
        const isEnemy = occupantOwner && occupantOwner !== myOwner;
        
        if (isEnemy && allowedRanges.includes(dist)) {
           targets.push(targetCoord);
        }
        break;
      }
    }
  });

  return targets;
};

export const getMandatoryMoves = (
  pieceId: PieceKey,
  currentPosition: string,
  gameState: Record<string, string>
): string[] => {
  const rule = ATTACK_RULES[pieceId];
  const requiredDist = rule ? rule.mandatoryMove : 1;
  const allMoves = getValidMoves(pieceId, currentPosition, false, gameState);
  const { rowNum: startRow } = parseCoord(currentPosition);

  return allMoves.filter(target => {
     const { rowNum: endRow } = parseCoord(target);
     const d = Math.abs(endRow - startRow);
     return d === requiredDist;
  });
};

export type Winner = 'player1' | 'player2' | 'draw' | null;

export const executeAttack = (
  targetCoord: string,
  currentGameState: Partial<Record<PieceKey, string>>
) => {
  const targetPieceId = (Object.keys(currentGameState) as PieceKey[]).find(
    key => currentGameState[key] === targetCoord
  );

  if (!targetPieceId) return null;

  // Create new state with enemy removed
  const newGameState = { ...currentGameState };
  delete newGameState[targetPieceId];

  const winResult = checkWinCondition(newGameState);

  return {
    newGameState,
    capturedPieceId: targetPieceId,
    winner: winResult
  };
};

export const getMultiCaptureOptions = (
  pieceId: PieceKey,
  currentPosition: string,
  gameState: Record<string, string>,
  hasAlreadyMoved: boolean 
) => {
  // 1. Check for additional attacks (Chain Capture)
  const attacks = getValidAttacks(pieceId, currentPosition, gameState, 'pre-move', false);
  
  // 2. Check for Mandatory Move
  // You can only move if you haven't moved yet in this turn.
  let moves: string[] = [];
  if (!hasAlreadyMoved) {
     moves = getMandatoryMoves(pieceId, currentPosition, gameState);
  }

  return { attacks, moves };
};

export const checkWinCondition = (gameState: Partial<Record<string, string>>): Winner => {
  const pieces = Object.keys(gameState);
  
  const p1SupremoAlive = pieces.includes('piece1');
  const p2SupremoAlive = pieces.includes('piece2');

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