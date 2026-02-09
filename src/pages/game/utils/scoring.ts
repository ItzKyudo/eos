export const PIECE_VALUES: Record<string, number> = {
    'Supremo': 7,
    'Chancellor': 6,
    'Vice Roy': 5,
    'Archer': 4,
    'Deacon': 3,
    'Minister': 2,
    'Steward': 1
};

/**
 * Calculates capture points for a specific player from move history.
 */
export const calculateCapturePoints = (moveHistory: any[], playerRole: 'player1' | 'player2') => {
    let totalPointsCapture = 0;
    let totalCapturedCount = 0;

    if (Array.isArray(moveHistory)) {
        moveHistory.forEach(move => {
            // We check for 'captures' or 'shoots' in the pieceName
            if (move.player === playerRole && (move.pieceName.includes('captures') || move.capturedPiece || move.pieceName.includes('shoots'))) {
                let captorName = "";
                let victimName = "";

                if (move.pieceName.includes(' captures ')) {
                    [captorName, victimName] = move.pieceName.split(' captures ');
                } else if (move.pieceName.includes(' shoots ')) {
                    [captorName, victimName] = move.pieceName.split(' shoots ');
                }

                if (captorName && victimName) {
                    const cleanCaptor = captorName.replace(/ \d+[a-z]?$/, '').trim();
                    const cleanVictim = victimName.replace(/ \d+[a-z]?$/, '').trim();

                    const captorVal = PIECE_VALUES[cleanCaptor] || 0;
                    const victimVal = PIECE_VALUES[cleanVictim] || 0;

                    totalPointsCapture += (captorVal + victimVal);
                    totalCapturedCount++;
                }
            }
        });
    }
    return { points: totalPointsCapture, count: totalCapturedCount };
};

/**
 * Calculates the exact Score to add/deduct based on the User's formula.
 */
export const calculatePlayerScore = (moveHistory: any[], winnerRole: 'player1' | 'player2', winCondition: string) => {
    // 1. Calculate Capture Points
    const { points: totalPointsCapture, count: totalCapturedCount } = calculateCapturePoints(moveHistory, winnerRole);

    // 2. Win Bonus
    let winningBonus = 0;
    if (winCondition === 'solitude') {
        winningBonus = 5;
    }
    else if (winCondition === 'supremo_capture' || winCondition === 'opponent_quit' || winCondition === 'resignation') {
        winningBonus = 10;
    }

    // 3. Captured Ratio
    const capturedRatio = (totalCapturedCount / 17) * 10;

    // 4. Final Total
    const totalScore = totalPointsCapture + winningBonus + capturedRatio;

    return Math.round(totalScore);
};
