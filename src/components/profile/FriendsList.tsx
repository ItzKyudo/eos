import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../../hooks/useFriendsStatus';
import { Gamepad2, X, Check, Clock, Zap, Target, Hourglass } from 'lucide-react';

interface FriendsListProps {
    className?: string;
    limit?: number;
    showInvite?: boolean;
    selectedTime?: number; // Currently selected time from RightPanel (default suggestion)
    userId?: string | number;
}

// Data for the modes available in the modal
const GAME_MODES = [
    { label: 'Bullet', time: 60, icon: <Zap size={18} className="text-yellow-400" />, desc: '1 min' },
    { label: 'Blitz', time: 300, icon: <Target size={18} className="text-red-400" />, desc: '5 min' },
    { label: 'Rapid', time: 600, icon: <Clock size={18} className="text-blue-400" />, desc: '10 min' },
    { label: 'Classic', time: 1800, icon: <Hourglass size={18} className="text-green-400" />, desc: '30 min' },
];

const FriendsList: React.FC<FriendsListProps> = ({
    className = "",
    limit,
    showInvite = false,
    selectedTime = 600,
    userId
}) => {
    const navigate = useNavigate();

    // Check if this is the current user's friend list
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnFriends = !userId || userId === currentUser.id;

    const { friends, loading, sendChallenge } = useFriendsStatus({
        targetUserId: userId
    });

    // State to track which friend is being challenged (triggers modal open)
    const [challengingFriend, setChallengingFriend] = useState<any | null>(null);

    // State to track the selected time inside the modal (defaults to prop value)
    const [modalTime, setModalTime] = useState<number>(selectedTime);

    // Sort: Online first
    const sortedFriends = [...friends].sort((a, b) => {
        if (a.isOnline === b.isOnline) return 0;
        return a.isOnline ? -1 : 1;
    });

    const displayFriends = limit ? sortedFriends.slice(0, limit) : sortedFriends;

    // 1. OPEN MODAL: User clicks invite button
    const handleInviteClick = (friend: any) => {
        // Pre-select the time from props, but allow changing it
        setModalTime(selectedTime);
        setChallengingFriend(friend); // This opens the modal
    };

    // 2. SEND INVITE: User confirms in modal
    const executeInvite = () => {
        if (challengingFriend) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            sendChallenge(
                challengingFriend.user_id,
                modalTime,
                user.username || 'Friend'
            );
            setChallengingFriend(null); // Close modal
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
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/profile/${friend.user_id}`)}
                        >
                            <div className="relative w-10 h-10">
                                {/* Avatar */}
                                <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                                    {friend.avatar_url ? (
                                        <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Status Dot */}
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

                        {showInvite && isOwnFriends && friend.isOnline && (
                            <button
                                onClick={() => handleInviteClick(friend)}
                                className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all text-white shadow-lg"
                                title="Challenge Friend"
                            >
                                <Gamepad2 size={16} />
                            </button>
                        )}
                    </div>
                ))
            )}

            {/* --- UNIFIED CHALLENGE MODAL --- */}
            {isOwnFriends && challengingFriend && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#1e293b] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 transform transition-all scale-100 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setChallengingFriend(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[#0f172a] shadow-lg">
                                <Gamepad2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Challenge <span className="text-blue-400">{challengingFriend.username}</span></h3>
                            <p className="text-gray-400 text-xs mt-1">Select a game mode for this match</p>
                        </div>

                        {/* Mode Selection Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {GAME_MODES.map((mode) => (
                                <button
                                    key={mode.label}
                                    onClick={() => setModalTime(mode.time)}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                                        ${modalTime === mode.time
                                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                            : 'bg-[#0f172a] border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="mb-1 opacity-90">{mode.icon}</div>
                                    <span className="text-sm font-bold">{mode.label}</span>
                                    <span className="text-[10px] opacity-60 font-medium">{mode.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Selected Summary */}
                        <div className="bg-[#0f172a] rounded-lg p-3 mb-6 flex items-center justify-center gap-2 border border-white/5">
                            <span className="text-gray-400 text-xs">Selected:</span>
                            <span className="text-blue-400 font-bold text-sm">
                                {modalTime / 60} Minutes ({GAME_MODES.find(m => m.time === modalTime)?.label || 'Custom'})
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setChallengingFriend(null)}
                                className="flex-1 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeInvite}
                                className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Send Challenge
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendsList;