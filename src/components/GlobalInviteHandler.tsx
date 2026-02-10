import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import InviteReceivedModal from './profile/InviteReceivedModal';
import SentInviteModal from './profile/SentInviteModal';

const GlobalInviteHandler: React.FC = () => {
    const navigate = useNavigate();

    // Enable global invite listening
    const {
        incomingChallenge,
        sentChallenge,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        clearSentChallenge
    } = useFriendsStatus({ enableInvites: true });

    // Handle Match Found Navigation Globally
    useEffect(() => {
        const handleMatchFound = (e: Event) => {
            let detail = (e as CustomEvent).detail;
            console.log("Global Match Found Handler RAW:", detail);

            // Clear any sent invite modal when match is found
            clearSentChallenge();

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
                // Do NOT navigate to /game as fallback, as it confuses users.
            }
        };

        window.addEventListener('matchFound', handleMatchFound);
        return () => window.removeEventListener('matchFound', handleMatchFound);
    }, [navigate, clearSentChallenge]);

    return (
        <>
            {/* Incoming Challenge Modal */}
            {incomingChallenge && (
                <InviteReceivedModal
                    isOpen={!!incomingChallenge}
                    challengerName={incomingChallenge.challengerName || 'Friend'}
                    timeControl={incomingChallenge.timeControl || 600}
                    onAccept={() => acceptChallenge(incomingChallenge.challengerId, incomingChallenge.timeControl)}
                    onDecline={() => declineChallenge(incomingChallenge.challengerId)}
                />
            )}

            {/* Outgoing Challenge Modal (Sent by us) */}
            {sentChallenge && (
                <SentInviteModal
                    isOpen={!!sentChallenge}
                    friendName={sentChallenge.targetUserName}
                    timeControl={sentChallenge.timeControl}
                    onCancel={() => cancelChallenge(sentChallenge.targetUserId)}
                    onTimeout={() => clearSentChallenge()}
                />
            )}
        </>
    );
};

export default GlobalInviteHandler;
