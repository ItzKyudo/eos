import React, { useState } from 'react';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import { Gamepad2 } from 'lucide-react';
import ChallengeModal from './ChallengeModal';

interface FriendsListProps {
    className?: string;
    limit?: number;
    showInvite?: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ className = "", limit, showInvite = false }) => {
    const { friends, loading, sendChallenge } = useFriendsStatus();
    const [selectedFriend, setSelectedFriend] = useState<any>(null);

    // Sort: Online first
    const sortedFriends = [...friends].sort((a, b) => {
        if (a.isOnline === b.isOnline) return 0;
        return a.isOnline ? -1 : 1;
    });

    const displayFriends = limit ? sortedFriends.slice(0, limit) : sortedFriends;

    const handleInvite = (friend: any) => {
        setSelectedFriend(friend);
    };

    const confirmChallenge = (timeControl: number) => {
        if (selectedFriend) {
            // You might want to get the current user's name from context/storage to pass
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            sendChallenge(selectedFriend.user_id, timeControl, user.username || 'Friend');
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {loading ? (
                <div className="text-center text-gray-500 text-sm py-4">Loading friends...</div>
            ) : displayFriends.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-700 rounded-lg">
                    <div className="text-2xl mb-1 opacity-50">👥</div>
                    <p>No friends added yet.</p>
                </div>
            ) : (
                displayFriends.map(friend => (
                    <div key={friend.friendship_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10">
                                {/* Avatar Wrapper */}
                                <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                                    {friend.avatar_url ? (
                                        <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Status Dot - Outside Top Right */}
                                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] z-20
                                    ${friend.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}
                                />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-200 text-sm">{friend.username}</div>
                                <div className="text-xs text-gray-500">
                                    {friend.isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>

                        {showInvite && friend.isOnline && (
                            <button
                                onClick={() => handleInvite(friend)}
                                className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all text-white"
                                title="Invite to Game"
                            >
                                <Gamepad2 size={16} />
                            </button>
                        )}
                    </div>
                ))
            )}

            <ChallengeModal
                isOpen={!!selectedFriend}
                onClose={() => setSelectedFriend(null)}
                onSendChallenge={confirmChallenge}
                friendName={selectedFriend?.username || 'Friend'}
            />
        </div>
    );
};

export default FriendsList;
