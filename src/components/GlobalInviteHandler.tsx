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
            const detail = (e as CustomEvent).detail;
            console.log("Global Match Found Handler:", detail);
            if (detail && detail.matchId) {
                navigate(`/multiplayer/${detail.matchId}`);
            } else {
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
