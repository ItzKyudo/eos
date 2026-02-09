import React, { useState, useEffect } from "react";
import Sidebar from '../components/sidebar';
import { Users, Check, X, UserX, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import Leaderboard from '../components/Leaderboard';

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

    // Use hook for Friends list and Online Status
    // Note: The hook returns mapped friends which might have slightly different interface but we cast/adapt if needed.
    // The hook's Friend interface has { user_id, username, isOnline ... }
    const { friends, loading: friendsLoading, refreshFriends } = useFriendsStatus();

    const [requests, setRequests] = useState<Friend[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [inviteCopied, setInviteCopied] = useState(false);

    // Handlers for "Add Friend via Link" action
    const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error' | 'loading', message: string } | null>(null);

    useEffect(() => {
        fetchRequests();
        handleUrlActions();
    }, []);

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const response = await fetch(`${serverUrl}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch friends");
            const data = await response.json();

            setRequests(data.incomingRequests || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleUrlActions = async () => {
        const action = searchParams.get('action');
        const targetId = searchParams.get('id');

        if (action === 'add' && targetId) {
            // Clear params to prevent re-triggering on refresh
            setSearchParams({});

            sendFriendRequest(targetId);
        }
    };

    const sendFriendRequest = async (targetId: string) => {
        setActionStatus({ type: 'loading', message: 'Sending friend request...' });
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const response = await fetch(`${serverUrl}/api/friends/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId: targetId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send request');

            setActionStatus({ type: 'success', message: 'Friend request sent successfully!' });
            fetchRequests(); // Refresh requests list
        } catch (err: any) {
            setActionStatus({ type: 'error', message: err.message });
        }

        // Clear status after 3s
        setTimeout(() => setActionStatus(null), 3000);
    };

    const acceptRequest = async (friendshipId: number) => {
        try {
            const token = localStorage.getItem('token');
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const response = await fetch(`${serverUrl}/api/friends/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ friendshipId })
            });

            if (!response.ok) throw new Error('Failed to accept');

            fetchRequests();
            if (refreshFriends) refreshFriends();
        } catch (err) {
            console.error(err);
        }
    };

    const removeFriend = async (friendshipId: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem('token');
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const response = await fetch(`${serverUrl}/api/friends/${friendshipId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to remove');

            if (refreshFriends) refreshFriends();
        } catch (err) {
            console.error(err);
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
                // Standard JWT often uses 'sub', Supabase/custom might use 'user_id' or 'id'
                const userId = payload.sub || payload.user_id || payload.id;

                if (!userId) {
                    console.error("Could not find user ID in token payload:", payload);
                    return;
                }

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
        <div className="flex min-h-screen bg-[#262522] text-[#bababa] font-sans overflow-x-hidden">
            <Sidebar />
            <main className="flex-1 p-8 ml-20">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="text-[#81b64c]" size={32} />
                            Social
                        </h1>

                        {/* Action Feedback Toast */}
                        {actionStatus && (
                            <div className={`px-4 py-2 rounded-lg text-white text-sm font-semibold animate-fade-in-down flex items-center gap-2
                    ${actionStatus.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
                                {actionStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                {actionStatus.message}
                            </div>
                        )}

                        {/* Global Error Display */}
                        {error && (
                            <div className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </header>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-white/10 mb-8">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'friends' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Friends
                            {activeTab === 'friends' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#81b64c]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'leaderboard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Leaderboard
                            {activeTab === 'leaderboard' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#81b64c]" />
                            )}
                        </button>
                    </div>

                    <div className="space-y-8">
                        {activeTab === 'friends' && (
                            <>
                                {/* Invite Link Section */}
                                <div className="bg-[#302e2b] rounded-xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Invite Friends</h3>
                                        <p className="text-sm text-gray-400">Share this link to let people add you instantly.</p>
                                    </div>
                                    <button
                                        onClick={copyInviteLink}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#81b64c] hover:bg-[#a3d160] text-white rounded-lg font-semibold transition-all active:scale-95"
                                    >
                                        {inviteCopied ? <Check size={18} /> : <LinkIcon size={18} />}
                                        {inviteCopied ? "Copied!" : "Copy Invite Link"}
                                    </button>
                                </div>

                                {/* Friend Requests */}
                                {loadingRequests ? (
                                    <div className="text-center py-4 text-gray-500 text-xs">Checking for requests...</div>
                                ) : requests.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Friend Requests</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {requests.map(req => (
                                                <div key={req.friendship_id} className="bg-[#302e2b] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => navigate(`/profile/${req.user_id}`)}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                                            {req.avatar_url ? <img src={req.avatar_url} alt={req.username} /> : <User2IconPlaceholder />}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{req.username}</p>
                                                            <p className="text-xs text-gray-500">Wants to be friends</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => acceptRequest(req.friendship_id)}
                                                            className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors" title="Accept"
                                                        >
                                                            <Check size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFriend(req.friendship_id)}
                                                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Decline"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Friends List */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">My Friends ({friends.length})</h3>
                                    {friendsLoading ? (
                                        <div className="text-center py-12 text-gray-500">Loading friends...</div>
                                    ) : friends.length === 0 ? (
                                        <div className="text-center py-12 bg-[#302e2b] rounded-xl border border-white/5 border-dashed">
                                            <Users className="mx-auto text-gray-600 mb-2" size={48} />
                                            <p className="text-gray-400">You haven't added any friends yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {friends.map((friend: any) => (
                                                <div key={friend.friendship_id} className="bg-[#302e2b] p-4 rounded-xl border border-white/10 flex items-center justify-between group hover:border-white/20 transition-all">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => navigate(`/profile/${friend.user_id}`)}
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden relative">
                                                            {friend.status_message && (
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-center p-1">
                                                                    {friend.status_message}
                                                                </div>
                                                            )}
                                                            {friend.avatar_url ? <img src={friend.avatar_url} alt={friend.username} /> : <User2IconPlaceholder />}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{friend.username}</p>
                                                            <p className={`text-xs flex items-center gap-1 ${friend.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                                                                <span className={`w-2 h-2 rounded-full ${friend.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                                                {friend.isOnline ? 'Online' : 'Offline'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => removeFriend(friend.friendship_id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                                                        title="Remove Friend"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'leaderboard' && (
                            <Leaderboard />
                        )}
                    </div>
                </div>
            </main>
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