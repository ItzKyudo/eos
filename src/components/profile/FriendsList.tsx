import React from 'react';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import { Gamepad2 } from 'lucide-react';

interface FriendsListProps {
    className?: string;
    limit?: number;
    showInvite?: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ className = "", limit, showInvite = false }) => {
    const { friends, loading } = useFriendsStatus();

    // Sort: Online first
    const sortedFriends = [...friends].sort((a, b) => {
        if (a.isOnline === b.isOnline) return 0;
        return a.isOnline ? -1 : 1;
    });

    const displayFriends = limit ? sortedFriends.slice(0, limit) : sortedFriends;

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
                            <div className="relative w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                                        {friend.username[0].toUpperCase()}
                                    </div>
                                )}
                                {/* Status Dot */}
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e293b] 
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
                            <button className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all text-white" title="Invite to Game">
                                <Gamepad2 size={16} />
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default FriendsList;
