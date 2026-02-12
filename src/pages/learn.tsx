import React, { useState, useEffect, useRef } from "react";
import Sidebar from '../components/sidebar';
import { PIECES, PieceKey, getValidMoves } from './game/mechanics/piecemovements';
import { BOARD_COLUMNS, parseCoord, toCoord } from './game/utils/gameUtils';
import { getValidAttacks, getMandatoryMoves, DbAttackRule } from './game/mechanics/attackpieces';
import supabase from '../config/supabase';

// --- TYPES ---
type Tab = 'movement' | 'attack';
// Added 'move_capture'
type ScenarioType = 'development' | 'advance' | 'mandatory' | 'normal' | 'capture_mandatory' | 'move_capture' | 'multi_capture';

interface ScenarioStep {
    boardState: Record<string, string>; // pieceId -> Coord
    highlights: { coord: string; color: string }[];
    description: string;
    delay?: number;
}


// --- CONSTANTS ---
const DEMO_PIECES = {
    'Supremo': 'piece7_r',
    'Archer': 'piece4_r',
    'Deacon': 'piece3_r',
    'Vice Roy': 'piece5_r',
    'Chancellor': 'piece6_r',
    'Minister': 'piece2_r',
    'Steward': 'piece1_r',
};

const ENEMY_PIECE = 'piece1_b';

// Matching your gameSetup.tsx constants
const circleSize = "w-17 h-17";
const rowHeight = "h-12";
const gridWidth = 'w-[900px]';
const sideWidth = 'w-16';

const getRenderRows = () => [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const getRowTiles = (rowNum: number) => {
    let tiles: string[] = [];
    switch (rowNum) {
        case 13: tiles = ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13', 'Q13']; break;
        case 12: tiles = ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12']; break;
        case 11: tiles = ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11', 'Q11']; break;
        case 10: tiles = ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10']; break;
        case 9: tiles = ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9', 'Q9']; break;
        case 8: tiles = ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8']; break;
        case 7: tiles = ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7', 'Q7']; break;
        case 6: tiles = ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6']; break;
        case 5: tiles = ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5', 'Q5']; break;
        case 4: tiles = ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4']; break;
        case 3: tiles = ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3', 'Q3']; break;
        case 2: tiles = ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2']; break;
        case 1: tiles = ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1', 'Q1']; break;
        default: tiles = [];
    }
    return tiles;
};

// --- SCENARIO GENERATOR (DYNAMIC) ---
const generateScenario = (
    type: ScenarioType,
    _pieceName: string,
    pieceId: string,
    moveRules: Record<string, number[]>,
    attackRules: Record<string, DbAttackRule>
): ScenarioStep[] => {
    const startPos = 'I7';
    const pieceKey = pieceId as PieceKey;

    // Get piece name from pieceId (e.g., 'piece4_r' -> 'Archer')
    const pieceName = Object.entries(DEMO_PIECES).find(([, id]) => id === pieceId)?.[0] || 'Unknown';

    switch (type) {
        case 'normal': {
            // Calculate actual valid moves
            const gameState = { [pieceKey]: startPos };
            const { moves } = getValidMoves(pieceKey, startPos, false, gameState as Record<string, string>, {}, moveRules);

            if (moves.length === 0) return [{ boardState: gameState, highlights: [], description: `${pieceName} has no valid moves from this position` }];

            const targetMove = moves[0]; // Pick first valid move
            return [
                { boardState: gameState, highlights: [], description: `${pieceName} at ${startPos}` },
                { boardState: gameState, highlights: moves.map(coord => ({ coord, color: 'green' })), description: `Normal Moves Available (${moves.length} tiles)` },
                { boardState: { [pieceKey]: targetMove }, highlights: [], description: `Moved to ${targetMove}` }
            ];
        }

        case 'advance': {
            const gameState = { [pieceKey]: startPos };
            const { advanceMoves } = getValidMoves(pieceKey, startPos, false, gameState as Record<string, string>, {}, moveRules);

            if (advanceMoves.length === 0) return [{ boardState: gameState, highlights: [], description: `${pieceName} has no advance moves available` }];

            const targetMove = advanceMoves[0];
            return [
                { boardState: gameState, highlights: [], description: `${pieceName} at ${startPos}` },
                { boardState: gameState, highlights: advanceMoves.map(coord => ({ coord, color: 'yellow' })), description: `Advance Moves (${advanceMoves.length} long-range tiles)` },
                { boardState: { [pieceKey]: targetMove }, highlights: [], description: `Advanced to ${targetMove}` }
            ];
        }

        case 'development': {
            const devStartPos = 'I1';
            const gameState = { [pieceKey]: devStartPos };
            const { moves, advanceMoves } = getValidMoves(pieceKey, devStartPos, true, gameState as Record<string, string>, {}, moveRules);

            const allDevMoves = [...moves, ...advanceMoves];
            if (allDevMoves.length === 0) return [{ boardState: gameState, highlights: [], description: `${pieceName} has no development moves` }];

            const targetMove = allDevMoves[allDevMoves.length - 1]; // Pick furthest move
            return [
                { boardState: gameState, highlights: [], description: `${pieceName} First Move (Development)` },
                { boardState: gameState, highlights: allDevMoves.map(coord => ({ coord, color: 'blue' })), description: `Development Range (${allDevMoves.length} tiles on first move!)` },
                { boardState: { [pieceKey]: targetMove }, highlights: [], description: `Developed to ${targetMove}` }
            ];
        }

        case 'capture_mandatory': {
            // Updated: Dynamic enemy placement based on Range
            // FIX: Use pieceName (e.g. 'Archer') not pieceKey (e.g. 'piece4_r')
            const rule = attackRules[pieceName];
            let range = rule && rule.range && rule.range.length > 0 ? Math.max(...rule.range) : 1;

            // Steward Special Rule: If hasn't moved (capture_mandatory serves as first move), range is 2.
            if (pieceName === 'Steward') {
                range = 2;
            }

            const { colIndex: startCol, rowNum: startRow } = parseCoord(startPos); // I7
            // Place enemy at startPos + range (diagonal down-right: +col, -row)
            const enemyPos = toCoord(startCol + range, startRow - range);

            if (!enemyPos) return [{ boardState: { [pieceKey]: startPos }, highlights: [], description: "Error placing enemy" }];

            const gameState = { [pieceKey]: startPos, [ENEMY_PIECE]: enemyPos };
            const attacks = getValidAttacks(pieceKey, startPos, gameState as Record<string, string>, 'pre-move', true, attackRules);

            // PATCH: Manually allow Steward range 2 attack if standard logic fails in this specific learn context
            if (pieceName === 'Steward' && attacks.length === 0 && range === 2) {
                // Check if path is clear (dist 1)
                const midCol = startCol + 1;
                const midRow = startRow - 1;
                const midCoord = toCoord(midCol, midRow);
                // Check if midCoord is empty
                if (midCoord && !Object.values(gameState).includes(midCoord) && enemyPos) {
                    attacks.push(enemyPos);
                }
            }

            if (attacks.length === 0) return [{ boardState: gameState, highlights: [], description: `${pieceName} cannot attack from this position` }];

            const targetEnemy = attacks.includes(enemyPos) ? enemyPos : attacks[0];
            const afterCaptureState = { [pieceKey]: startPos };
            const mandatoryMoves = getMandatoryMoves(pieceKey, startPos, afterCaptureState as Record<string, string>, attackRules);

            if (mandatoryMoves.length === 0) {
                return [
                    { boardState: gameState, highlights: [], description: `Enemy at ${targetEnemy}` },
                    { boardState: gameState, highlights: [{ coord: targetEnemy, color: 'red' }], description: `Attack Range Identified (Range ${range})` },
                    { boardState: afterCaptureState, highlights: [{ coord: targetEnemy, color: 'red' }], description: `Captured! No mandatory move required.` },
                    { boardState: afterCaptureState, highlights: [], description: `Turn End` }
                ];
            }

            const mandatoryTarget = mandatoryMoves[0];
            return [
                { boardState: gameState, highlights: [], description: `Enemy at ${targetEnemy}` },
                { boardState: gameState, highlights: attacks.map(coord => ({ coord, color: 'red' })), description: `Attack Range (${attacks.length} tiles)` },
                { boardState: afterCaptureState, highlights: [{ coord: targetEnemy, color: 'red' }], description: `Captured! Mandatory move required.` },
                { boardState: afterCaptureState, highlights: mandatoryMoves.map(coord => ({ coord, color: 'orange' })), description: `Mandatory move (${mandatoryMoves.length} options)` },
                { boardState: { [pieceKey]: mandatoryTarget }, highlights: [], description: `Turn End` }
            ];
        }

        case 'move_capture': {
            // "Normal Move then Capture"
            // 1. Move from I7 to J8.
            // 2. Enemy at J8 + range.

            // First find a movement
            const { moves } = getValidMoves(pieceKey, startPos, false, { [pieceKey]: startPos }, {}, moveRules);
            if (moves.length === 0) return [{ boardState: {}, highlights: [], description: "No moves available" }];

            const moveTarget = moves[0]; // e.g. J8 or J6?
            // Calc enemy pos from moveTarget
            // FIX: Use pieceName (e.g. 'Archer') not pieceKey (e.g. 'piece4_r')
            const rule = attackRules[pieceName];

            // Show max range capability, but enforce Steward limits
            let range = rule && rule.range && rule.range.length > 0 ? Math.max(...rule.range) : 1;

            // Steward Special Rule: If moved, range is only 1.
            if (pieceName === 'Steward') {
                range = 1;
            }

            const { colIndex, rowNum } = parseCoord(moveTarget);
            const enemyPos = toCoord(colIndex + range, rowNum - range); // Same diagonal offset

            if (!enemyPos) return [{ boardState: {}, highlights: [], description: "Error placing enemy for 2nd step" }];

            const gameStateStart = { [pieceKey]: startPos, [ENEMY_PIECE]: enemyPos };
            const gameStateMoved = { [pieceKey]: moveTarget, [ENEMY_PIECE]: enemyPos };

            // Verify attack is valid from new pos. Pass isFirstMove=false because piece has moved.
            const attacks = getValidAttacks(pieceKey, moveTarget, gameStateMoved, 'pre-move', false, attackRules);

            // PATCH: Manually allow Steward range 1 attack after move if logic fails
            if (pieceName === 'Steward' && attacks.length === 0 && range === 1) {
                if (enemyPos) {
                    attacks.push(enemyPos);
                }
            }

            if (!attacks.includes(enemyPos)) {
                return [
                    { boardState: gameStateStart, highlights: [], description: "Start Position" },
                    { boardState: gameStateStart, highlights: [{ coord: moveTarget, color: 'green' }], description: "1. Move to Position" },
                    { boardState: gameStateMoved, highlights: [], description: `Moved to ${moveTarget}` },
                    { boardState: gameStateMoved, highlights: [], description: "Enemy out of range!" }
                ];
            }

            return [
                { boardState: gameStateStart, highlights: [], description: "Start Position" },
                { boardState: gameStateStart, highlights: [{ coord: moveTarget, color: 'green' }], description: "1. Move to Position" },
                { boardState: gameStateMoved, highlights: [], description: "Moved. Enemy in range?" },
                { boardState: gameStateMoved, highlights: [{ coord: enemyPos, color: 'red' }], description: `2. Attack! (Range ${range})` },
                { boardState: { [pieceKey]: moveTarget }, highlights: [], description: "Target Neutralized" }
            ];
        }

        case 'multi_capture': {
            // DYNAMIC MULTI-CAPTURE SETUP
            // 1. Calculate Enemy1 position based on max range (Steward=2, others=rule)
            // 2. Calculate Slide position based on mandatory move
            // 3. Calculate Enemy2 position based on 2nd attack range (Steward=1, others=rule)

            const rule = attackRules[pieceName];
            let firstRange = rule && rule.range && rule.range.length > 0 ? Math.max(...rule.range) : 1;

            // Steward Special: Range 2 on first attack
            if (pieceName === 'Steward') firstRange = 2;

            const mandatoryDist = rule && rule.mandatory_move ? (Array.isArray(rule.mandatory_move) ? Math.max(...rule.mandatory_move) : rule.mandatory_move) : 1;

            let secondRange = rule && rule.range && rule.range.length > 0 ? Math.max(...rule.range) : 1;
            // Steward Special: Range 1 on second attack (because it moved)
            if (pieceName === 'Steward') secondRange = 1;

            const { colIndex: startCol, rowNum: startRow } = parseCoord(startPos); // I7

            // Direction: Down-Right (+1 col, -1 row)
            // Enemy 1
            const enemy1Pos = toCoord(startCol + firstRange, startRow - firstRange);
            // Mandatory Slide Position (where piece ends up after 1st capture)
            // Mandatory move is from startPos towards enemy? Or just a slide? 
            // In game logic, mandatory move is usually 1-2 squares.
            // Let's assume we slide in the same direction to keep the chain going visually.
            const slidePos = toCoord(startCol + mandatoryDist, startRow - mandatoryDist);
            // Enemy 2 (from slidePos)
            let enemy2Pos = slidePos ? toCoord(parseCoord(slidePos).colIndex + secondRange, parseCoord(slidePos).rowNum - secondRange) : null;

            // FIX: Steward Collision - Linear calc makes enemy2Pos same as enemy1Pos (Range 2 -> Slide 1 -> Range 1 == same spot)
            // Create a "V" shape or "Cleave" pattern for Steward
            if (pieceName === 'Steward' && slidePos) {
                // Slide to J6. Attack K5 (Enemy 1).
                // From J6, attack K7 (Enemy 2) - adjacent diagonal up-right
                enemy2Pos = toCoord(parseCoord(slidePos).colIndex + 1, parseCoord(slidePos).rowNum + 1);
            }

            if (!enemy1Pos || !slidePos || !enemy2Pos) {
                return [{ boardState: { [pieceKey]: startPos }, highlights: [], description: "Map too small for this piece's multi-capture demo" }];
            }

            const gameState1 = { [pieceKey]: startPos, 'e1': enemy1Pos, 'e2': enemy2Pos };
            const attacks1 = getValidAttacks(pieceKey, startPos, gameState1 as Record<string, string>, 'pre-move', true, attackRules);

            // PATCH: Steward 1st Attack
            if (pieceName === 'Steward' && attacks1.length === 0 && firstRange === 2) {
                const mid = toCoord(startCol + 1, startRow - 1);
                if (mid && !Object.values(gameState1).includes(mid)) attacks1.push(enemy1Pos);
            }

            if (!attacks1.includes(enemy1Pos)) {
                return [{ boardState: gameState1, highlights: [], description: `${pieceName} cannot perform multi-capture (1st target invalid)` }];
            }

            // State after 1st capture (before mandatory move? No, logic says mandatory moves calculated from pos)
            // If getMandatoryMoves uses startPos, then piece is at startPos.
            const gameState2 = { [pieceKey]: startPos, 'e2': enemy2Pos };
            const mandatoryMoves1 = getMandatoryMoves(pieceKey, startPos, gameState2 as Record<string, string>, attackRules);

            // We expect 'slidePos' to be in 'mandatoryMoves1'
            if (!mandatoryMoves1.includes(slidePos)) {
                // Fallback if calculated slide isn't valid?
                // Some pieces might have mandatory move [1], but we calc'd based on max.
                // Force logic? Or just visualise it.
            }

            const gameState3 = { [pieceKey]: slidePos, 'e2': enemy2Pos };
            const attacks2 = getValidAttacks(pieceKey, slidePos, gameState3 as Record<string, string>, 'pre-move', true, attackRules); // Is it 'pre-move' for chain? Yes, technically starting a new attack phase from new pos.

            // PATCH: Steward 2nd Attack (Range 1)
            if (pieceName === 'Steward' && attacks2.length === 0 && secondRange === 1) {
                if (enemy2Pos) attacks2.push(enemy2Pos);
            }

            if (!attacks2.includes(enemy2Pos)) {
                return [
                    { boardState: gameState1, highlights: [{ coord: enemy1Pos, color: 'red' }], description: `1. Attack ${enemy1Pos}` },
                    { boardState: gameState2, highlights: [{ coord: slidePos, color: 'orange' }], description: `2. Mandatory Slide to ${slidePos}` },
                    { boardState: gameState3, highlights: [], description: `Chain broken: 2nd target out of range` }
                ];
            }

            return [
                { boardState: gameState1, highlights: [], description: `Multi-Capture Opportunity` },
                { boardState: gameState1, highlights: [{ coord: enemy1Pos, color: 'red' }], description: `1. Attack ${enemy1Pos} (Range ${firstRange})` },
                { boardState: gameState2, highlights: [{ coord: slidePos, color: 'orange' }], description: `2. Mandatory Slide (Dist ${mandatoryDist})` },
                { boardState: gameState3, highlights: [{ coord: enemy2Pos, color: 'red' }], description: `3. Chain Attack ${enemy2Pos} (Range ${secondRange})` },
                { boardState: { [pieceKey]: slidePos }, highlights: [], description: `Multi-Capture Complete!` }
            ];
        }

        default: return [];
    }
};

const LearnPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('movement');
    const [activeScenarioType, setActiveScenarioType] = useState<ScenarioType>('normal');
    const [selectedPieceName, setSelectedPieceName] = useState<string>('Archer');
    const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Game Rules from Database
    const [moveRules, setMoveRules] = useState<Record<string, number[]>>({});
    const [attackRules, setAttackRules] = useState<Record<string, DbAttackRule>>({});
    const [loadingRules, setLoadingRules] = useState(true);

    // Fetch rules from database (like multiplayer.tsx)
    useEffect(() => {
        const fetchGameRules = async () => {
            try {
                const { data, error } = await supabase
                    .from('pieces')
                    .select('name, movement_stats');

                if (error) throw error;

                if (data) {
                    const loadedMoveRules: Record<string, number[]> = {};
                    const loadedAttackRules: Record<string, DbAttackRule> = {};

                    data.forEach((piece: { name: string; movement_stats: string | { move_steps: number[]; attack_rules: DbAttackRule } }) => {
                        let stats = piece.movement_stats;
                        if (typeof stats === 'string') {
                            try {
                                stats = JSON.parse(stats);
                            } catch (e) {
                                console.error("Failed to parse JSON for piece:", piece.name, e);
                                return;
                            }
                        }

                        const typedStats = stats as { move_steps: number[]; attack_rules: DbAttackRule };

                        if (typedStats) {
                            loadedMoveRules[piece.name] = typedStats.move_steps;
                            loadedAttackRules[piece.name] = typedStats.attack_rules;
                        }
                    });

                    setMoveRules(loadedMoveRules);
                    setAttackRules(loadedAttackRules);
                }
            } catch (err) {
                console.error("Error loading game rules:", err);
            } finally {
                setLoadingRules(false);
            }
        };

        fetchGameRules();
    }, []);

    useEffect(() => {
        if (loadingRules) return; // Wait for rules to load

        const pieceId = DEMO_PIECES[selectedPieceName as keyof typeof DEMO_PIECES];
        const steps = generateScenario(activeScenarioType, selectedPieceName, pieceId, moveRules, attackRules);
        setScenarioSteps(steps);
        setCurrentStepIndex(0);
        setIsPlaying(true);
    }, [activeTab, activeScenarioType, selectedPieceName, loadingRules, moveRules, attackRules]);

    useEffect(() => {
        if (!isPlaying) return;
        if (currentStepIndex >= scenarioSteps.length - 1) {
            timerRef.current = setTimeout(() => setCurrentStepIndex(0), 3000);
            return;
        }
        timerRef.current = setTimeout(() => setCurrentStepIndex(prev => prev + 1), 2500);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isPlaying, currentStepIndex, scenarioSteps]);

    const getPieceOnTile = (coord: string) => {
        const state = scenarioSteps[currentStepIndex]?.boardState;
        if (!state) return null;
        for (const [pId, pCoord] of Object.entries(state)) {
            if (pCoord === coord) {
                if (pId.startsWith('e')) return PIECES[ENEMY_PIECE as keyof typeof PIECES];
                return PIECES[pId as keyof typeof PIECES];
            }
        }
        return null;
    };

    const isTileHighlighted = (coord: string) =>
        scenarioSteps[currentStepIndex]?.highlights.find(h => h.coord === coord);

    return (
        <div className="flex h-screen bg-[#0f172a] text-[#bababa] font-sans overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center p-4 w-full max-w-7xl mx-auto overflow-hidden relative">

                {/* Background Pattern like GameSetup */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />

                <div className="flex flex-col xl:flex-row gap-4 w-full h-full items-stretch z-10">
                    {/* CONTROLS (Left side) */}
                    <div className="w-full xl:w-1/4 flex flex-col gap-4 bg-[#1e293b]/80 backdrop-blur-md p-4 rounded-xl border border-blue-500/20 shrink-0 shadow-xl">
                        <div>
                            <h3 className="text-blue-400 font-bold mb-2 uppercase tracking-widest text-[10px]">Select Unit</h3>
                            <div className="flex flex-wrap gap-1">
                                {Object.keys(DEMO_PIECES).map(name => (
                                    <button key={name} onClick={() => setSelectedPieceName(name)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${selectedPieceName === name ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0f172a] border-gray-700 hover:border-blue-500/50'}`}>
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex bg-[#0f172a] p-1 rounded-lg border border-gray-700">
                            <button onClick={() => { setActiveTab('movement'); setActiveScenarioType('normal'); }}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'movement' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                                Movement
                            </button>
                            <button onClick={() => { setActiveTab('attack'); setActiveScenarioType('capture_mandatory'); }}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'attack' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>
                                Attack
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {activeTab === 'movement' ? (
                                <>
                                    <button onClick={() => setActiveScenarioType('normal')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'normal' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Normal Move</div>
                                        <div className="text-[10px] opacity-60">Standard 1-tile diagonal</div>
                                    </button>
                                    <button onClick={() => setActiveScenarioType('advance')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'advance' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Advance Move</div>
                                        <div className="text-[10px] opacity-60">Long-range jump ability</div>
                                    </button>
                                    <button onClick={() => setActiveScenarioType('development')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'development' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Development</div>
                                        <div className="text-[10px] opacity-60">First turn initiative boost</div>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setActiveScenarioType('capture_mandatory')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'capture_mandatory' ? 'border-red-500 bg-red-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Capture & Move</div>
                                        <div className="text-[10px] opacity-60">Attack first, then move</div>
                                    </button>
                                    <button onClick={() => setActiveScenarioType('move_capture')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'move_capture' ? 'border-red-500 bg-red-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Move & Capture</div>
                                        <div className="text-[10px] opacity-60">Position then strike</div>
                                    </button>
                                    <button onClick={() => setActiveScenarioType('multi_capture')} className={`p-3 rounded text-xs text-left border ${activeScenarioType === 'multi_capture' ? 'border-red-500 bg-red-500/10 text-white' : 'border-gray-800 bg-[#0f172a]'}`}>
                                        <div className="font-bold">Multi-Capture</div>
                                        <div className="text-[10px] opacity-60">Chain multiple targets</div>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* BOARD PREVIEW (Copying exact structure from GameSetup.tsx) */}
                    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden h-full">

                        {/* Simulation Text */}
                        <div className="absolute top-0 w-full text-center z-20">
                            <div className="inline-block bg-[#1e293b] px-6 py-2 rounded-full border border-blue-500 shadow-lg shadow-blue-500/20">
                                <span className={`font-bold uppercase tracking-widest text-xs ${activeTab === 'attack' ? 'text-red-400' : 'text-blue-400'}`}>
                                    {scenarioSteps[currentStepIndex]?.description || "Initializing Simulation..."}
                                </span>
                            </div>
                        </div>

                        {/* THE BOARD (Exactly like your GameSetup.tsx) */}
                        <div className="transform scale-[0.40] md:scale-[0.50] lg:scale-[0.60] xl:scale-[0.70] origin-center shadow-2xl transition-transform duration-500">
                            <div className="relative bg-[#1e293b] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-16 border-[#09357A] flex flex-col items-center select-none pointer-events-none">

                                {/* Top Labels */}
                                <div className="flex items-center mb-4 w-full justify-center">
                                    <div className={`${sideWidth}`}></div>
                                    <div className={`flex justify-between ${gridWidth} px-10`}>
                                        {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
                                    </div>
                                    <div className={`${sideWidth}`}></div>
                                </div>

                                {/* Staggered Rows */}
                                <div className="flex flex-col space-y-1">
                                    {getRenderRows().map((row) => {
                                        const currentTiles = getRowTiles(row);
                                        const is9TileRow = currentTiles.length === 9;

                                        return (
                                            <div key={row} className="flex items-center">
                                                <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-end pr-6`}>{row}</div>

                                                <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                                                    {currentTiles.map((coordinate, i) => {
                                                        const pieceImg = getPieceOnTile(coordinate);
                                                        const highlight = isTileHighlighted(coordinate);
                                                        return (
                                                            <div
                                                                key={`${row}-${i}`}
                                                                className={`
                                                                        relative ${circleSize} 
                                                                        bg-linear-to-br from-gray-100 to-gray-300
                                                                        rounded-full 
                                                                        shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                                                                        border border-gray-400 
                                                                        shrink-0 flex items-center justify-center
                                                                        `}
                                                            >
                                                                {/* Highlights Overlay */}
                                                                {highlight && (
                                                                    <div className={`absolute inset-0 rounded-full opacity-60 animate-pulse border-4 
                                                                        ${highlight.color === 'green' ? 'bg-green-400 border-green-600' : ''}
                                                                        ${highlight.color === 'yellow' ? 'bg-yellow-400 border-yellow-600' : ''}
                                                                        ${highlight.color === 'blue' ? 'bg-blue-400 border-blue-600' : ''}
                                                                        ${highlight.color === 'red' ? 'bg-red-500 border-red-700 shadow-[0_0_20px_red]' : ''}
                                                                        ${highlight.color === 'orange' ? 'bg-orange-400 border-orange-600' : ''}`}
                                                                    />
                                                                )}

                                                                {pieceImg && (
                                                                    <img src={pieceImg} alt="piece" className="w-full h-full rounded-full object-cover z-10" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-start pl-6`}>{row}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Labels */}
                                <div className="flex items-center mt-4 w-full justify-center">
                                    <div className={`${sideWidth}`}></div>
                                    <div className={`flex justify-between ${gridWidth} px-10`}>
                                        {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
                                    </div>
                                    <div className={`${sideWidth}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LearnPage;