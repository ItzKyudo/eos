import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import InviteReceivedModal from './profile/InviteReceivedModal';

const GlobalInviteHandler: React.FC = () => {
    const navigate = useNavigate();

    // Enable global invite listening
    const { incomingChallenge, acceptChallenge, declineChallenge } = useFriendsStatus({ enableInvites: true });

    // Handle Match Found Navigation Globally
    useEffect(() => {
        const handleMatchFound = (e: Event) => {
            let detail = (e as CustomEvent).detail;
            console.log("Global Match Found Handler RAW:", detail);

            // Robustness: Parse if string (shouldn't happen with socket.io but safe)
            if (typeof detail === 'string') {
                try {
                    detail = JSON.parse(detail);
                } catch (err) {
                    console.error("Failed to parse match details:", err);
                }
            }

            // Robustness: Check for matchId, id, or gameId
            const targetId = detail?.matchId || detail?.id || detail?.gameId;

            if (targetId) {
                navigate(`/multiplayer/${targetId}`);
            } else {
                console.error("Match ID missing in payload:", detail);
                navigate('/game');
            }
        };

        window.addEventListener('matchFound', handleMatchFound);
        return () => window.removeEventListener('matchFound', handleMatchFound);
    }, [navigate]);

    if (!incomingChallenge) return null;

    return (
        <InviteReceivedModal
            isOpen={!!incomingChallenge}
            challengerName={incomingChallenge.challengerName || 'Friend'}
            timeControl={incomingChallenge.timeControl || 600}
            onAccept={() => acceptChallenge(incomingChallenge.challengerId, incomingChallenge.timeControl)}
            onDecline={() => declineChallenge(incomingChallenge.challengerId)}
        />
    );
};

export default GlobalInviteHandler;
