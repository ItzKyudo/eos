import React, { useState, useEffect } from "react";
import api from '../api/axios';
import Sidebar from '../components/sidebar';
import { Users, Check, X, UserX, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import Leaderboard from '../components/Leaderboard';
import ConfirmationModal from '../components/ConfirmationModal';

interface Friend {
    friendship_id: number;
    user_id: number;
    username: string;
    avatar_url?: string;
    status_message?: string;
    friendship_created_at: string;
    isOnline?: boolean;
}

const SocialPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');
    const { friends, loading: friendsLoading, refreshFriends } = useFriendsStatus();

    const [requests, setRequests] = useState<Friend[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [inviteCopied, setInviteCopied] = useState(false);
    const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error' | 'loading', message: string } | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        confirmText?: string;
    } | null>(null);

    useEffect(() => {
        fetchRequests();
        handleUrlActions();
    }, []);

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.get('/friends');

            // Axios throws on non-2xx, so no need for !response.ok check usually, 
            // but let's stick to standard axios patterns.
            setRequests(response.data.incomingRequests || []);
        } catch (err: any) {
            console.error(err);
            // Axios errors have err.response.data.message usually
            const message = err.response?.data?.message || err.message;
            setError(message);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleUrlActions = async () => {
        const action = searchParams.get('action');
        const targetId = searchParams.get('id');

        if (action === 'add' && targetId) {
            setSearchParams({});
            sendFriendRequest(targetId);
        }
    };

    const sendFriendRequest = async (targetId: string) => {
        setActionStatus({ type: 'loading', message: 'Sending friend request...' });
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await api.post('/friends/request', { targetUserId: targetId });

            setActionStatus({ type: 'success', message: 'Friend request sent successfully!' });
            fetchRequests();
        } catch (err: any) {
            const message = err.response?.data?.message || err.message;
            setActionStatus({ type: 'error', message });
        }
        setTimeout(() => setActionStatus(null), 3000);
    };

    const acceptRequest = async (friendshipId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Although axios interceptor adds it, safe guard.

            await api.put('/friends/accept', { friendshipId });

            fetchRequests();
            if (refreshFriends) refreshFriends();
        } catch (err) {
            console.error(err);
        }
    };

    const confirmRemoveFriend = (friendshipId: number, username: string) => {
        setModalConfig({
            title: "Remove Friend",
            message: `Are you sure you want to remove ${username} from your friends list?`,
            type: 'danger',
            confirmText: "Remove",
            onConfirm: () => handleRemoveFriend(friendshipId)
        });
        setIsModalOpen(true);
    };

    const handleRemoveFriend = async (friendshipId: number) => {
        try {
            await api.delete(`/friends/${friendshipId}`);

            if (refreshFriends) refreshFriends();

            // Also update requests if modifying from there (though typically remove is for friends list)
            setRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));

            setActionStatus({ type: 'success', message: 'Friend removed' });
            setTimeout(() => setActionStatus(null), 3000);

        } catch (err) {
            console.error(err);
            setActionStatus({ type: 'error', message: 'Failed to remove friend' });
        }
    };

    const copyInviteLink = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                const userId = payload.sub || payload.user_id || payload.id;

                if (!userId) return;

                const link = `${window.location.origin}/social?action=add&id=${userId}`;
                navigator.clipboard.writeText(link);
                setInviteCopied(true);
                setTimeout(() => setInviteCopied(false), 2000);
            } catch (e) {
                console.error("Token decode error", e);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-200 relative">
            <Sidebar />

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none fixed z-0" />

            {/* Main container with overflow-hidden to prevent global page breaking on mobile */}
            <main className="flex-1 w-full p-4 md:p-8 pb-24 md:pb-8 relative z-10 overflow-hidden">
                <div className="max-w-5xl mx-auto w-full">

                    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="text-blue-500" size={32} />
                            Social
                        </h1>

                        <div className="flex flex-col items-end gap-2">
                            {actionStatus && (
                                <div className={`px-4 py-2 rounded-lg text-white text-sm font-semibold animate-fade-in-down flex items-center gap-2
                                    ${actionStatus.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
                                    {actionStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {actionStatus.message}
                                </div>
                            )}
                            {error && (
                                <div className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Navigation Tabs - Added horizontal scroll for small devices */}
                    <div className="flex border-b border-slate-700 mb-8 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap relative ${activeTab === 'friends' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Friends
                            {activeTab === 'friends' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap relative ${activeTab === 'leaderboard' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Leaderboard
                            {activeTab === 'leaderboard' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                            )}
                        </button>
                    </div>

                    <div className="w-full">
                        {activeTab === 'friends' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Invite Link Card */}
                                <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700/50 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                                    <div className="relative z-10 text-center md:text-left">
                                        <h3 className="text-white font-semibold mb-1">Invite Friends</h3>
                                        <p className="text-sm text-slate-400">Share this link with others to grow your network.</p>
                                    </div>
                                    <button
                                        onClick={copyInviteLink}
                                        className="w-full md:w-auto relative z-10 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                    >
                                        {inviteCopied ? <Check size={18} /> : <LinkIcon size={18} />}
                                        {inviteCopied ? "Copied!" : "Copy Invite Link"}
                                    </button>
                                </div>

                                {/* Incoming Friend Requests */}
                                {loadingRequests ? (
                                    <div className="text-center py-4 text-slate-500 text-xs">Checking for requests...</div>
                                ) : requests.length > 0 && (
                                    <div className="animate-slideDown">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Friend Requests</h3>
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                            {requests.map(req => (
                                                <div key={req.friendship_id} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => navigate(`/profile/${req.user_id}`)}>
                                                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                            {req.avatar_url ? <img src={req.avatar_url} alt={req.username} className="w-full h-full object-cover" /> : <User2IconPlaceholder />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate">{req.username}</p>
                                                            <p className="text-xs text-blue-400">Wants to be friends</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <button onClick={() => acceptRequest(req.friendship_id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg"><Check size={20} /></button>
                                                        <button onClick={() => confirmRemoveFriend(req.friendship_id, req.username)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X size={20} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* My Friends List */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        My Friends <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full">{friends.length}</span>
                                    </h3>
                                    {friendsLoading ? (
                                        <div className="text-center py-12 text-slate-500">Loading friends...</div>
                                    ) : friends.length === 0 ? (
                                        <div className="text-center py-12 bg-[#1e293b] rounded-xl border border-slate-700 border-dashed">
                                            <Users className="mx-auto text-slate-600 mb-2" size={48} />
                                            <p className="text-slate-400">You haven't added any friends yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                            {friends.map((friend: any) => (
                                                <div key={friend.friendship_id} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                                    <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => navigate(`/profile/${friend.user_id}`)}>
                                                        <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                            {friend.avatar_url ? <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" /> : <User2IconPlaceholder />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate">{friend.username}</p>
                                                            <p className={`text-xs flex items-center gap-1 ${friend.isOnline ? 'text-green-400' : 'text-slate-500'}`}>
                                                                <span className={`w-2 h-2 rounded-full ${friend.isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></span>
                                                                {friend.isOnline ? 'Online' : 'Offline'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => confirmRemoveFriend(friend.friendship_id, friend.username)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"><UserX size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <div className="w-full overflow-hidden animate-in fade-in duration-300">
                                <Leaderboard />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {modalConfig && (
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    confirmText={modalConfig.confirmText}
                    onConfirm={modalConfig.onConfirm}
                    type={modalConfig.type}
                />
            )}
        </div>
    );
};

const User2IconPlaceholder = () => (
    <svg className="w-full h-full text-gray-400 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export default SocialPage;